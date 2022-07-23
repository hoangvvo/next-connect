# Changelog

## 0.13.0

- returns 404 if all matches are middleware on handler (edc99ddb7531dd399294158063cbfb2eb4fbe80d)
- Bump dev dependencies (f2d9b1945c156c01d72b70f339d215c62d340ce5)
- Build module using rollup (#190)

## 0.12.2

- Add back next() in error handler

## 0.12.1

- breaking: flow change: handle() does not use onError (ad857bedb0996312ad3a5ea966ce3a60417429a6)
- fix: make sure handler is resolvable (#178)

## 0.11.1

- Bump deps and switch to NPM
- typescript: added export for types (#176)

## 0.11.0

- Allow regular expressions to be used for route. (#157)

## 0.10.2

- Export the options interface (#152)

## 0.10.1

- Make NextConnect compatible with NextApiHandler (#128)
- docs(README): fix typo (#123)
- Mark sideEffects false and update README (21c9c73fe3746e66033fd51e2aa01d479e267ad6)

## 0.10.0

- Express Router compatibility (#121)
- Add ESModule export (#122)

## 0.9.1

- Deprecate apply() for run() (#108)

## 0.9.0

- Add all() to match any methods (#105)

## 0.8.1

- Fix handler return type (#75)

## 0.8.0

- Fix TypeScript signature and support both API and non-API pages (#70) (Breaking)

## 0.7.1

- Call trouter#find with pathname (#62)

## 0.7.0

- feat: add support for handler generics (#57)
- Consider base when mounting subapp (#61)

## 0.6.6

- Fix uncaught error in async middleware (#50)

## 0.6.5

- Fix uncaught error in non-async functions (#45)

## 0.6.4

- Add TypeScript definition (#44)

## 0.6.3

- Refactor for performance (#42)

## 0.6.2

- Fix catching async function error

## 0.6.1

- Fix "API resolved without sending a response"
- Handle error properly in .apply

## 0.6.0

- Use Trouter (#25)
- Add onError and onNoMatch (#26)

### Breaking changes

Error middleware (`.use(err, req, res, next)` and `.error(err, req, res)`) is deprecated. Use `options.onError` instead.

## 0.5.2

- Fix cleared stack (#23)

## 0.5.1

- Fix next-connect fail to work if multiple instances are used (015aa37bdd6ba9b50a97cf9d6c8eebc25f111fd0)

## 0.5.0

- Rewrite (Optimize codebase) and allow multiple handles in use() and error() (#13)
- Update README.md (6ef206903393d37c7f34f05005ff97738695b9b3)

## 0.4.0

- Add support for non-api pages (#11)

## 0.3.0

- Enable reusing middleware (#8)

## 0.2.0

- Render 404 when headers are not sent (No response) (#7)
- Add other HTTP methods (#6)

## 0.1.0

- Rewrite core (#3)

We can now `default export` `handler` instead of `handler.export()`

- Improve readme (#2)

## 0.0.1

- Initial commit
- Add Test and CircleCI (#1)
