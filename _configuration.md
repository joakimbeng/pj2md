## Configuration

All CLI options can be configured in a `pj2md` section in your `package.json`.
This way you don't have to type the same options in the command prompt all the time.

#### Configuration example

```json
{
  "pj2md": {
    "logo": "media/package-logo.png",
    "api": false,
    "postdescription": "extended-description.md",
    "preusage": "some-nice-info.md",
    "related": [
      "a-related-package",
      "another-related-pkg"
    ]
  }
}
```

**Note:** options passed via CLI takes precedence over the configuration in `package.json`.
