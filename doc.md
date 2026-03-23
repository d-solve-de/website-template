## Pull Request Previews (Implemented .github/workflows/pr-preview.yml)
- Created a dedicated PR Preview Action to deploy a static website preview when a PR is opened, reopened, or synchronized, and tear it down when closed.
- Used `rossjrw/pr-preview-action@v1` which deploys previews into a specific subfolder (`pr-preview/`) on a separate branch (`gh-pages`).
- Added a `<meta name="robots" content="noindex, nofollow">` HTML tag insertion step before deployment. This prevents search engine bots from parsing the duplicate preview environments, protecting the main page's SEO score.
- **Safety regarding original files**: The PR preview action strictly works on an isolated branch (`gh-pages`). Closing the PR will only delete the specific PR's subdirectory (e.g. `pr-preview/pr-5`). The original `website/` directory on the `main` branch is entirely untouched and safe.
