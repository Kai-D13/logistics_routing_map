# 🤝 Contributing to Logistics Routing System

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

---

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn and grow

---

## 🚀 Getting Started

### 1. Fork the Repository

Click the "Fork" button on GitHub to create your own copy.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/logistics-routing-system.git
cd logistics-routing-system
```

### 3. Add Upstream Remote

```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/logistics-routing-system.git
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Setup Environment

Copy `.env.example` to `.env` and fill in your credentials.

---

## 🔄 Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding tests

### 2. Make Changes

- Write clean, readable code
- Follow existing code style
- Add comments where necessary
- Update documentation if needed

### 3. Test Your Changes

```bash
# Test database connection
npm run test:db

# Start dev server
npm run dev

# Test in browser
# Open http://localhost:5000
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add new feature"
```

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request

Go to GitHub and create a Pull Request from your fork to the main repository.

---

## 💻 Coding Standards

### JavaScript

- Use ES6+ features
- Use `const` and `let`, avoid `var`
- Use arrow functions where appropriate
- Use async/await instead of callbacks
- Add JSDoc comments for functions

Example:
```javascript
/**
 * Calculate distance between two points
 * @param {Object} origin - Origin coordinates {lat, lng}
 * @param {Object} destination - Destination coordinates {lat, lng}
 * @returns {Promise<Object>} Distance and duration data
 */
async function calculateDistance(origin, destination) {
    // Implementation
}
```

### CSS

- Use meaningful class names
- Follow BEM naming convention when possible
- Group related properties
- Use CSS variables for colors and spacing

### HTML

- Use semantic HTML5 elements
- Add proper ARIA labels for accessibility
- Keep markup clean and readable

---

## 📝 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance tasks

### Examples

```bash
feat(map): add custom marker icons
fix(api): resolve geocoding timeout issue
docs(readme): update installation instructions
refactor(ui): simplify modal component
```

---

## 🔍 Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] Commit messages follow guidelines
- [ ] No merge conflicts

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
How to test these changes

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process

1. Maintainer will review your PR
2. Address any feedback
3. Once approved, PR will be merged
4. Your contribution will be credited

---

## 🐛 Reporting Bugs

### Before Reporting

- Check if bug already exists in Issues
- Try to reproduce the bug
- Gather relevant information

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment:**
- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.0.0]

**Additional context**
Any other information
```

---

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Description of the problem

**Describe the solution you'd like**
Clear description of desired feature

**Describe alternatives you've considered**
Other solutions you've thought about

**Additional context**
Any other information
```

---

## 🎯 Areas for Contribution

### High Priority
- [ ] Unit tests for backend services
- [ ] Integration tests for API endpoints
- [ ] Error handling improvements
- [ ] Performance optimization

### Medium Priority
- [ ] UI/UX improvements
- [ ] Additional map features
- [ ] Export functionality
- [ ] Advanced filtering

### Low Priority
- [ ] Code documentation
- [ ] Example projects
- [ ] Tutorial videos
- [ ] Translations

---

## 📚 Resources

- [Project Documentation](./README.md)
- [API Documentation](./README.md#api-endpoints)
- [Database Schema](./database/schema-v2.sql)
- [Deployment Guide](./DEPLOYMENT.md)

---

## ❓ Questions?

If you have questions:
1. Check existing documentation
2. Search closed issues
3. Ask in Discussions
4. Contact maintainers

---

## 🙏 Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort!

---

**Happy Coding! 🚀**

