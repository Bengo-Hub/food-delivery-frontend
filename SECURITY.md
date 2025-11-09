# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| `main`  | ✅ | 
| Releases | ✅ (latest minor) |

## Reporting a Vulnerability

Please email [security@bengobox.com](mailto:security@bengobox.com) with the subject line `SECURITY: Food Delivery Frontend`. Provide:

- Description of the issue and potential impact
- Steps to reproduce (proof-of-concept code preferred)
- Affected versions / commit SHA
- Suggested remediation, if known

We will acknowledge receipt within **48 hours** and provide an initial assessment within **5 business days**. If the issue affects other services, we will coordinate a private fix across the BengoBox teams before disclosure.

## Responsible Disclosure

- Do not publicly disclose the vulnerability before a fix is released
- Avoid accessing or modifying data that is not your own
- Do not degrade service availability during testing

## Patching Process

1. Issue triaged and CVSS score assigned
2. Patch developed on a private branch, reviewed by security peers
3. Fix rolled out via CI/CD and ArgoCD deployment
4. Public advisory published in [`CHANGELOG.md`](CHANGELOG.md) and security bulletin channels

Thank you for helping keep BengoBox users safe.
