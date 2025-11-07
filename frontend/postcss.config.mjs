const config = {
  plugins: {
    // Temporarily only run autoprefixer so dev server can start.
    // Tailwind integration (via @tailwindcss/postcss) was causing runtime issues
    // with the currently installed Tailwind/PostCSS setup. We can re-enable it
    // once we confirm desired Tailwind version and plugin install.
    autoprefixer: {},
  },
};

export default config;
