Biome is the chosen linting and formatting provider. It is intended as a replacement to ESLint and Prettier, but has been developed such that migration should cause minimal breakage. Therefore, much of what was observed from the two prior services will be familiar in Biome, but it should be faster and more extensible.

### Configuring your IDE

1. You will need the [Biome extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) in order to see the linting errors.
3. Make sure that your [default formatter](vscode://settings/editor.defaultFormatter) is set to `Biome`, and that there are no other settings overriding it.
    - Optionally, you can set [format on save](vscode://settings/editor.formatOnSave) to make it even more transparent.

From here, your IDE should show you linting errors and format your files to the Biome configuration standards.

### Useful Knowledge

- To see all of the existing linting errors, run `npx @biomejs/biome lint --reporter=summary`. You will see a console log such as this one:
    ```
    > npx @biomejs/biome lint --reporter=summary
    reporter/analyzer ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

     i Some analyzer rules were triggered
   
     Rule Name                                          Diagnostics
   
     lint/complexity/noUselessEmptyExport               4 (4 error(s), 0 warning(s), 0 info(s))
     lint/suspicious/noEmptyInterface                   1 (1 error(s), 0 warning(s), 0 info(s))
     lint/complexity/useLiteralKeys                     16 (16 error(s), 0 warning(s), 0 info(s))
     lint/complexity/noBannedTypes                      36 (36 error(s), 0 warning(s), 0 info(s))
     lint/suspicious/noRedeclare                        2 (2 error(s), 0 warning(s), 0 info(s))
     lint/style/noDefaultExport                         4 (0 error(s), 4 warning(s), 0 info(s))
     lint/style/useImportType                           2 (2 error(s), 0 warning(s), 0 info(s))
   
   Checked 36 files in 9ms. No fixes applied.
   Found 61 errors.
   Found 4 warnings.
   lint    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ```

- From there, you can run `npx @biomejs/biome lint --log-kind=compact --max-diagnostics=none --only=LINTER_RULE_HERE --reporter=github` to see all of the instances of a particular linter rule in the codebase. 
  
  [!CAUTION] The CLI tool does not currently work with rule overrides set in the [Biome config](biome.jsonc#L140) so you will see some rules being applied to places they are specifically omitted in the config. This should be corrected in [Biome v2.0.0](https://biomejs.dev/blog/roadmap-2025/#%EF%B8%8F-biome-20).

- Another useful CLI tool is `npx @biomejs/biome lint --only=LINTER_RULE_HERE --write`, which will automatically fix the lint error if the rule has [a safe fix](https://biomejs.dev/linter/#safe-fixes). [Unsafe fixes](https://biomejs.dev/linter/#unsafe-fixes) can be fixed with the `--unsafe` flag, but you should verify the fix actually worked without changing any behavior of the code.

### Linting Rules

The configuration applies all of [Biome's recommended rules](https://biomejs.dev/linter/rules/#recommended-rules), plus additional opt-in rules set in [the config](biome.jsonc#L41). These additional rules were selected to help increase code performance, security, and clarity. If you think a particular rule is unnecessary, or if there is something not covered by this ruleset, you should start a discussion about it so that the codebase can be held to a high, but reasonable, standard.

If you are wondering why you should abide by a particular rule, you should follow the link provided in the error's source. The Biome documentation provides decent explanations as to why the rule is important.