# Contributing to MyLibrary

Thank you for your interest in contributing to MyLibrary!

## Code of Conduct

Please be respectful, constructive, and considerate in all communications and contributions.

## How to Contribute

1. **Fork the Repository:** Create a personal fork on GitHub.
2. **Create a Feature Branch:** Branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Coding Standards:**
   - Write clean, vanilla ES6+ JavaScript without adding unnecessary external dependencies.
   - Decouple domain and storage logic from UI presentation.
   - Validate and sanitize all user inputs.
4. **Testing:**
   - Run existing automated tests before submitting:
     ```bash
     node --test test/*.test.js
     node --check src/js/main.js
     ```
   - Add unit tests for new features or bug fixes under `test/`.
5. **Commit Conventions:** Use concise conventional commit messages (e.g., `feat: ...`, `fix: ...`, `docs: ...`, `test: ...`).
6. **Submit a Pull Request:** Open a pull request against `main` with a clear description of your changes.
