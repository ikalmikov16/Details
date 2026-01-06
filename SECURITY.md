# Security Policy

## Reporting a Vulnerability

Thank you for helping keep SketchOff and its users safe!

If you discover a security vulnerability, please report it responsibly:

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. **Email** the details to: irakli.kalmikov@gmail.com
3. Include as much detail as possible:
   - Type of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: You'll receive a response within 48 hours
- **Investigation**: We'll investigate and keep you updated on progress
- **Resolution**: We aim to resolve critical issues within 7 days
- **Credit**: With your permission, we'll credit you in the release notes

## Security Best Practices for Contributors

### Firebase Security

- Never commit `.env` files or Firebase credentials
- Always use environment variables for sensitive configuration
- Review Firebase security rules before modifying database/storage access
- Validate all user input before database operations

### Code Security

- Sanitize user-generated content (player names, etc.)
- Don't log sensitive information in production
- Keep dependencies updated to avoid known vulnerabilities
- Follow the principle of least privilege in security rules

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | ✅ Currently supported |

## Known Security Features

SketchOff implements several security measures:

- **Anonymous Authentication**: No personal data required to play
- **Firebase Security Rules**: Players can only modify their own data
- **Automatic Cleanup**: Stale data is automatically deleted
- **Input Validation**: Room codes and player names are validated
- **Size Limits**: Uploads are limited to prevent abuse

---

Thank you for helping keep SketchOff secure! 🛡️

