# Changelog

## 0.6.6

### Patches

- Fix uncaught error in async middleware (#50)

## 0.6.5

### Patches

- Fix uncaught error in non-async functions (#45)

## 0.6.4

### Patches

- Add TypeScript definition (#44)

## 0.6.3

### Patches

- Refactor for performance (#42)

## 0.6.2

### Patches

- Fix catching async function error

## 0.6.1

### Patches

- Fix "API resolved without sending a response"
- Handle error properly in .apply

## 0.6.0

### Major

- Use Trouter (#25)
- Add onError and onNoMatch (#26)

*Breaking changes*

Error middleware (`.use(err, req, res, next)` and `.error(err, req, res)`) is deprecated. Use `options.onError` instead.

## 0.5.2

### Patches

- Fix cleared stack (#23)

## 0.5.1

### Patches

- Fix next-connect fail to work if multiple instances are used (015aa37bdd6ba9b50a97cf9d6c8eebc25f111fd0)

## 0.5.0

### Minor

- Rewrite (Optimize codebase) and allow multiple handles in use() and error() (#13)

### Patches

- Update README.md (6ef206903393d37c7f34f05005ff97738695b9b3)

## 0.4.0

### Minor

- Add support for non-api pages (#11)

## 0.3.0

### Minor

- Enable reusing middleware (#8)

## 0.2.0

### Minor

- Render 404 when headers are not sent (No response) (#7)

### Patches

- Add other HTTP methods (#6)

## 0.1.0

### Major

- Rewrite core (#3)

We can now `default export` `handler` instead of `handler.export()`

### Patches

- Improve readme (#2)

## 0.0.1

- Initial commit
- Add Test and CircleCI (#1)
