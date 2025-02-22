Knip is made to catch when there is unused code in the codebase. This includes:
1. Exported functions/consts/interfaces/etc
2. Dependencies
3. Dead code
4. More stuff

To read more about why it's useful, check out [their own explanation](https://knip.dev/explanations/why-use-knip).

To see what it is currently reporting, run `npm run knip`. To save it to a file, try `npm run knip --reporter json > knip_report.json`.