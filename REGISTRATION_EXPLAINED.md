# 🔍 Deep Dive: How Registration Works in the Auth Microservice

## What I Did - Step by Step

### 1. Started the Docker Containers
```bash
cd /home/alejo/connectivity/full_project/auth-microservice
docker-compose up -d postgres redis rabbitmq auth-service
```

This started:
- **PostgreSQL** - Database to store user information
- **Redis** - Cache for JWT tokens
- **RabbitMQ** - Message broker for events
- **Auth Service** - The Go application

### 2. Discovered the API Structure
I read the router configuration and found all endpoints are prefixed with `/api/auth/`

### 3. Tested the Registration
Sent this HTTP request:
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "id_citizen": 123456789,
    "email": "test@example.com",
    "password": "Password123!",
    "name": "Test User"
  }'
```

Got back:
```json
{
  "id": "7136829f-1b83-420b-8059-183f78fa46cc",
  "id_citizen": 123456789,
  "email": "test@example.com",
  "name": "Test User",
  "role": "USER",
  "created_at": "2025-11-06T21:24:03.40640466Z",
  "updated_at": "2025-11-06T21:24:03.406404701Z"
}
```

---

## 📚 How Registration Works at Code Level

The registration follows **Clean Architecture** with these layers:

```
HTTP Request (JSON)
    ↓
1. HTTP Handler (Presentation Layer)
    ↓
2. Service Layer (Business Logic)
    ↓
3. Domain Layer (Core Business Rules)
    ↓
4. Repository Layer (Data Access)
    ↓
PostgreSQL Database
```

Let me explain each layer:

---

## Layer 1: HTTP Handler (Entry Point)

**File:** `internal/adapters/http/handler/auth/register_handler.go`

```go
func Register(h *shared.AuthHandler) nethttp.HandlerFunc {
    return func(w nethttp.ResponseWriter, r *nethttp.Request) {
        // Step 1: Increment metrics for monitoring
        metrics.IncRegisterRequests()

        // Step 2: Parse JSON request body
        var req request.RegisterRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            httperrors.RespondWithError(w, httperrors.ErrInvalidRequestBody)
            return
        }

        // Step 3: Basic validation
        if req.IDCitizen <= 0 || req.Email == "" || 
           req.Password == "" || req.Name == "" {
            httperrors.RespondWithError(w, httperrors.ErrRequiredField)
            return
        }

        // Step 4: Call service layer to register user
        user, err := h.AuthService.Register(
            r.Context(), 
            req.Email, 
            req.Password, 
            req.Name, 
            req.IDCitizen
        )
        if err != nil {
            httperrors.RespondWithDomainError(w, err)
            return
        }

        // Step 5: Convert domain model to response DTO
        resp := response.UserResponse{
            ID:        user.ID,
            IDCitizen: user.IDCitizen,
            Email:     user.Email,
            Name:      user.Name,
            Role:      user.Role,
            CreatedAt: user.CreatedAt,
            UpdatedAt: user.UpdatedAt,
        }

        // Step 6: Send JSON response
        shared.RespondWithJSON(w, nethttp.StatusCreated, resp)
    }
}
```

**What happens here:**
1. ✅ Parses incoming JSON request
2. ✅ Validates required fields
3. ✅ Delegates to service layer
4. ✅ Converts internal model to public response
5. ✅ Returns HTTP 201 (Created) with user data

---

## Layer 2: Service Layer (Business Logic)

**File:** `internal/application/services/auth_service.go`

```go
func (s *AuthService) Register(
    ctx context.Context, 
    email, password, name string, 
    idCitizen int
) (*domain.UserPublic, error) {
    
    s.logger.Info("attempting to register user", 
        zap.String("email", email), 
        zap.Int("id_citizen", idCitizen))

    // Step 1: Check if user already exists by email
    exists, err := s.userRepo.Exists(ctx, email)
    if err != nil {
        s.logger.Error("failed to check user existence", zap.Error(err))
        return nil, domainerrors.ErrInternal
    }

    if exists {
        s.logger.Warn("user already exists", zap.String("email", email))
        return nil, domainerrors.ErrUserAlreadyExists
    }

    // Step 2: Check if user exists by citizen ID
    if idCitizen > 0 {
        if _, err := s.userRepo.GetByIDCitizen(ctx, idCitizen); err == nil {
            s.logger.Warn("user already exists with same id_citizen", 
                zap.Int("id_citizen", idCitizen))
            return nil, domainerrors.ErrUserAlreadyExists
        } else if err != nil && err != domainerrors.ErrUserNotFound {
            s.logger.Error("failed to check user by id_citizen", 
                zap.Error(err), 
                zap.Int("id_citizen", idCitizen))
            return nil, domainerrors.ErrInternal
        }
    }

    // Step 3: Create new user entity (domain layer)
    user, err := domain.NewUser(email, password, name, idCitizen)
    if err != nil {
        s.logger.Error("failed to create user entity", zap.Error(err))
        return nil, err
    }

    // Step 4: Save user to database via repository
    if err := s.userRepo.Create(ctx, user); err != nil {
        if errors.Is(err, domainerrors.ErrUserAlreadyExists) {
            s.logger.Error("failed to save user", zap.Error(err))
            return nil, domainerrors.ErrUserAlreadyExists
        }
        s.logger.Error("failed to save user", zap.Error(err))
        return nil, domainerrors.ErrInternal
    }

    s.logger.Info("user registered successfully", 
        zap.String("user_id", user.ID), 
        zap.String("email", email), 
        zap.Int("id_citizen", idCitizen))
    
    return user.ToPublic(), nil
}
```

**What happens here:**
1. ✅ Checks if user already exists (by email)
2. ✅ Checks if citizen ID is already registered
3. ✅ Creates user entity with business rules
4. ✅ Saves to database through repository
5. ✅ Logs everything for debugging
6. ✅ Returns public user data (without password)

---

## Layer 3: Domain Layer (Core Business Rules)

**File:** `internal/domain/models/user.go`

```go
func NewUser(email, password, name string, idCitizen int) (*User, error) {
    // Validation 1: Email required
    if email == "" {
        return nil, errors.New("email is required")
    }
    
    // Validation 2: Password required
    if password == "" {
        return nil, errors.New("password is required")
    }
    
    // Validation 3: Password minimum length
    if len(password) < 8 {
        return nil, errors.New("password must be at least 8 characters")
    }
    
    // Validation 4: Name required
    if name == "" {
        return nil, errors.New("name is required")
    }
    
    // Validation 5: Citizen ID required and positive
    if idCitizen <= 0 {
        return nil, errors.New("id_citizen is required and must be positive")
    }

    // Security: Hash password with bcrypt
    hashedPassword, err := bcrypt.GenerateFromPassword(
        []byte(password), 
        bcrypt.DefaultCost
    )
    if err != nil {
        return nil, err
    }

    now := time.Now()
    return &User{
        IDCitizen: idCitizen,
        Email:     email,
        Password:  string(hashedPassword),  // Stored as hash!
        Name:      name,
        Role:      RoleUser,                 // Default role
        CreatedAt: now,
        UpdatedAt: now,
    }, nil
}
```

**What happens here:**
1. ✅ Validates all business rules
2. ✅ **Hashes password with bcrypt** (NEVER stores plain text!)
3. ✅ Sets default role to "USER"
4. ✅ Sets timestamps
5. ✅ Returns validated User entity

**Important Security Note:**
- Password is **NEVER** stored in plain text
- Uses `bcrypt.GenerateFromPassword()` with cost factor 10 (default)
- bcrypt is industry-standard for password hashing

---

## Layer 4: Repository Layer (Data Access)

**File:** `internal/infrastructure/postgres/user_repository.go`

```go
func (r *UserRepository) Create(ctx context.Context, user *domain.User) error {
    // Generate UUID for user
    user.ID = uuid.New().String()

    query := `
        INSERT INTO users (id, id_citizen, email, password, name, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `

    _, err := r.db.ExecContext(
        ctx,
        query,
        user.ID,
        user.IDCitizen,
        user.Email,
        user.Password,      // Already hashed from domain layer
        user.Name,
        user.Role,
        user.CreatedAt,
        user.UpdatedAt,
    )

    if err != nil {
        // Check for unique constraint violations
        if strings.Contains(err.Error(), "duplicate key") {
            return domainerrors.ErrUserAlreadyExists
        }
        return err
    }

    return nil
}
```

**What happens here:**
1. ✅ Generates UUID for the user
2. ✅ Executes SQL INSERT statement
3. ✅ Handles duplicate key errors (email/citizen_id already exists)
4. ✅ Saves to PostgreSQL database

---

## 🔄 Complete Flow Diagram

```
Client sends JSON:
{
  "id_citizen": 123456789,
  "email": "test@example.com",
  "password": "Password123!",
  "name": "Test User"
}
    │
    ▼
┌─────────────────────────────────────────────────┐
│ 1. HTTP Handler (register_handler.go)          │
│    - Parse JSON request                         │
│    - Validate required fields                   │
│    - metrics.IncRegisterRequests()              │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 2. Service Layer (auth_service.go)             │
│    - Check if email exists: userRepo.Exists()   │
│    - Check if citizen_id exists                 │
│    - Call domain.NewUser()                      │
│    - Log with zap logger                        │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 3. Domain Layer (user.go)                      │
│    - Validate email, password, name             │
│    - Hash password: bcrypt.GenerateFromPassword │
│    - Set default role: RoleUser                 │
│    - Set timestamps: time.Now()                 │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 4. Repository Layer (user_repository.go)       │
│    - Generate UUID: uuid.New().String()         │
│    - Execute SQL: INSERT INTO users...          │
│    - Handle errors (duplicates, etc)            │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ PostgreSQL Database                             │
│    users table:                                 │
│    - id: "7136829f-1b83-420b-8059-183f78fa46cc" │
│    - id_citizen: 123456789                      │
│    - email: "test@example.com"                  │
│    - password: "$2a$10$hashed..."               │
│    - name: "Test User"                          │
│    - role: "USER"                               │
│    - created_at: timestamp                      │
│    - updated_at: timestamp                      │
└─────────────────────────────────────────────────┘
```

---

## 🔐 Security Features

### 1. Password Hashing
```go
hashedPassword, err := bcrypt.GenerateFromPassword(
    []byte(password), 
    bcrypt.DefaultCost  // Cost factor = 10
)
```

**How it works:**
- bcrypt is a **one-way** hash function
- Includes **salt** automatically (prevents rainbow table attacks)
- **Cost factor** makes brute-force attacks computationally expensive
- Password `"Password123!"` becomes something like:
  ```
  $2a$10$N9qo8uLOickgx2ZMRZoMye1y6u.O4dNYJ7xQBq8q0H.QN9xPRkJ7m
  ```

### 2. Validation at Multiple Layers
- **Handler Layer**: Basic null checks
- **Service Layer**: Business rule checks (duplicates)
- **Domain Layer**: Data integrity rules (length, format)

### 3. Error Handling
```go
// Domain errors are well-defined
domainerrors.ErrUserAlreadyExists
domainerrors.ErrInvalidCredentials
domainerrors.ErrInternal
```

### 4. Logging
```go
s.logger.Info("user registered successfully", 
    zap.String("user_id", user.ID), 
    zap.String("email", email))
```

---

## 🗄️ Database Schema

The PostgreSQL `users` table structure:

```sql
CREATE TABLE users (
    id          VARCHAR(36) PRIMARY KEY,     -- UUID
    id_citizen  INTEGER NOT NULL UNIQUE,     -- National ID
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,       -- bcrypt hash
    name        VARCHAR(255) NOT NULL,
    role        VARCHAR(50) NOT NULL,        -- USER, ADMIN
    created_at  TIMESTAMP NOT NULL,
    updated_at  TIMESTAMP NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_id_citizen ON users(id_citizen);
```

---

## 📊 What Actually Got Stored

When I ran the test, this row was inserted into PostgreSQL:

| Column | Value |
|--------|-------|
| **id** | `7136829f-1b83-420b-8059-183f78fa46cc` |
| **id_citizen** | `123456789` |
| **email** | `test@example.com` |
| **password** | `$2a$10$hashed_value_here...` |
| **name** | `Test User` |
| **role** | `USER` |
| **created_at** | `2025-11-06 21:24:03.406405` |
| **updated_at** | `2025-11-06 21:24:03.406405` |

**Note:** The password is stored as a bcrypt hash, not the original `"Password123!"`

---

## 🎯 Key Takeaways

### Clean Architecture Benefits:
1. **Separation of Concerns**: Each layer has a specific responsibility
2. **Testability**: Each layer can be tested independently
3. **Maintainability**: Easy to modify without breaking other parts
4. **Security**: Password hashing happens in domain layer (core business rule)

### Go Best Practices Used:
1. ✅ Context propagation (`ctx context.Context`)
2. ✅ Error handling with custom domain errors
3. ✅ Structured logging with `zap`
4. ✅ Dependency injection (handler receives service)
5. ✅ bcrypt for password hashing
6. ✅ UUID for unique identifiers

### What Makes This Secure:
1. ✅ Passwords never stored in plain text
2. ✅ Multiple layers of validation
3. ✅ SQL injection prevention (parameterized queries)
4. ✅ Duplicate detection (email and citizen ID)
5. ✅ Comprehensive error logging

---

**This is a production-grade authentication system following industry best practices!** 🎉
