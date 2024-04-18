# Building the docs

## Pre-flight

If you're about to push out a new docs release, check the following first:

1. Are the version statements in the "installation.md" page still valid? If the version of Electron has been bumped, this page must be checked.


## Build process

The documentation for Ride lives at https://dyalog.github.io/ride. It is a GitHub Pages site, built with [mkdocs](https://www.mkdocs.org/), using the [material theme](https://squidfunk.github.io/mkdocs-material/).

Install the following components:

1. [mkdocs](https://www.mkdocs.org/user-guide/installation/)
2. [material theme](https://squidfunk.github.io/mkdocs-material/getting-started/)
3. [mkdocs-print-site plugin](https://timvink.github.io/mkdocs-print-site-plugin/index.html)
4. [mike](https://github.com/jimporter/mike)

`mike` is a versioning plugin for `mkdocs`. It allows us to publish separate documentation sets on a per-version basis of Ride, and have a 'latest' alias.

The documentation source lives in the `docs/` directory, and consists primarily of markdown files. The file `mkdocs.yml` defines the layout of the documentation site. 

To render the site locally, run

```
mike serve
```
This should serve it up on http://localhost:8000/ by default.

To 'compile' your changes, run the command 

```
mike deploy [version] # e.g. mike deploy 4.5
```

Note: this converts the markdown files etc to html, but doesn't serve, or indeed "deploy" the site. See the [docs](https://github.com/jimporter/mike/blob/master/README.md) for `mike` for the various commands that are available. 

If you want to publish to live, add a `--push` to your `mike deploy` command. This commits and pushes the rendered files to your `gh-pages` branch.

Use the command 

```
mike set-default [version]
```
in order to configure the redirects, such that visitors to `.../ride` will be redirected to `.../ride/4.5/` (or whatever the default is set to).

It is possible to build the docs automatically using an Action. See how [Link](https://github.com/Dyalog/link/blob/master/.github/workflows/mkdocs-mike-deploy.yml) does this in case this becomes necessary.

