<p align="center">
  <a href="https://github.com/joelpurra/vidy-slack-bot"><img src="./resources/screenshot/Screen%20Shot%202018-04-04%20at%2015.44.54.png" alt="Screenshot of the /vidy command used in Slack" width="610" height="610" border="0" /></a>
</p>
<p align="center">
  <a href="https://vidy.com/"><img src="./resources/icon/vidy-icon-82x80.png" alt="The VIDY logotype" width="41" height="40" border="0" /></a>
  ❤️
  <a href="https://slack.com/"><img src="./resources/icon/slack-icon-256x256.png" alt="The Slack logotype" width="40" height="40" border="0" /></a>
</p>
<h1 align="center">
  <a href="https://github.com/joelpurra/vidy-slack-bot">VIDY Slack Bot</a>
</h1>



Search, discover, watch, and share talking videos from [VIDY](https://vidy.com/) in [Slack](https://slack.com/).

- Create a new Slack bot to enable the [slash command](https://api.slack.com/slash-commands): `/vidy`
- Add keywords to say what you want: `/vidy hello there`
- Built to showcase VIDY integration using the [VIDY API](https://api.vidy.com/).
- The sandbox API makes it easy to get started:
  - Open access, no special authorization required.
  - Preconfigured in the setup examples.
  - Uses a smaller dataset of VIDYs.
  - Rate limited to maximum 1 request per second.
  - See also the [`vidy` NPM package](https://www.npmjs.com/package/vidy) ([source](https://github.com/joelpurra/node-vidy)).
- Deployable to [Google Cloud Functions](https://cloud.google.com/functions/) using the [`glcoud` CLI tool](https://cloud.google.com/sdk/gcloud/).



## Setup


**Name variables for the setup**

Change at least the suffix to a custom value; changing the rest is optional. Note that these shell variables are only used during setup, not for execution.

```shell
# NOTE: random number to avoid naming collisions.
export PROJECT_NAME_SUFFIX="678213"
```

These values do not *need* to be changed.

```shell
# NOTE: base project name for google cloud.
export PROJECT_NAME_PREFIX="vidy-slack-bot"

# NOTE: function name needs to match the name in code.
export PROJECT_FUNCTION_NAME="slackCommand"

# NOTE: combine to create other names.
export PROJECT_NAME="${PROJECT_NAME_PREFIX}-${PROJECT_NAME_SUFFIX}"
export PROJECT_BUCKET_NAME="${PROJECT_NAME}-bucket"
export PROJECT_RUNTIME_CONFIG_NAME="functions-${PROJECT_FUNCTION_NAME}"
```


**Google Cloud setup**

This guide assumes creating a new project, but you can deploy to an existing project. Make sure you can set the billing for the project, otherwise the functions won't work. Make sure you have [`gcloud`](https://cloud.google.com/sdk/gcloud/) installed.

```shell
# NOTE: create a new google cloud project.
gcloud projects create "$PROJECT_NAME"
gcloud config set project "$PROJECT_NAME"

# NOTE: need to enable billing for the project first, otherwise this call will fail.
gsutil mb "gs://${PROJECT_BUCKET_NAME}/"

# NOTE: create a runtime configuration.
gcloud beta runtime-config configs create "$PROJECT_RUNTIME_CONFIG_NAME"
```


**API access and bot configuration**

All configuration is stored in [Google Cloud Runtime Configurator](https://cloud.google.com/deployment-manager/runtime-configurator/).

```shell
# NOTE: list configuration keys.
gcloud beta runtime-config configs variables list --config-name "$PROJECT_RUNTIME_CONFIG_NAME"

# NOTE: see slack app/bot pages for your verification token.
gcloud beta runtime-config configs variables set "slackVerificationToken" "<YOUR SLACK VERIFICATION TOKEN>" --config-name "$PROJECT_RUNTIME_CONFIG_NAME"

# NOTE: default vidy sandbox configuration values.
gcloud beta runtime-config configs variables set "vidyAuthenticationKeyId" "sandbox" --config-name "$PROJECT_RUNTIME_CONFIG_NAME"
gcloud beta runtime-config configs variables set "vidyAuthenticationKeySecret" "sandbox" --config-name "$PROJECT_RUNTIME_CONFIG_NAME"
gcloud beta runtime-config configs variables set "vidyBaseUrlApi" "https://sandbox.vidy.com/" --config-name "$PROJECT_RUNTIME_CONFIG_NAME"
gcloud beta runtime-config configs variables set "vidyBaseUrlClip" "https://vidy.com/v/" --config-name "$PROJECT_RUNTIME_CONFIG_NAME"
gcloud beta runtime-config configs variables set "vidyBaseUrlSearch" "https://vidy.com/s/" --config-name "$PROJECT_RUNTIME_CONFIG_NAME"
gcloud beta runtime-config configs variables set "vidyApplicationLocale" "en-US" --config-name "$PROJECT_RUNTIME_CONFIG_NAME"
gcloud beta runtime-config configs variables set "vidyQueryLimit" "5" --config-name "$PROJECT_RUNTIME_CONFIG_NAME"

# NOTE: set the system uuid to something unique/random for your system.
gcloud beta runtime-config configs variables set "vidySystemUuid" "<YOUR VIDY SYSTEM UUID>" --config-name "$PROJECT_RUNTIME_CONFIG_NAME"
```



## Deployment

```shell
# NOTE: deploy the code as a new version to google cloud functions.
# NOTE: pushes all files in the current folder; see the file `.gcloudignore`.
# TODO: minify the amount of space used by using `npm install --production` etcetera.
# TODO: reduce function requirements by reducing memory limits etcetera.
gcloud beta functions deploy "$PROJECT_FUNCTION_NAME" --stage-bucket="$PROJECT_BUCKET_NAME" --trigger-http

# NOTE: test the deployed function locally.
gcloud beta functions call "$PROJECT_FUNCTION_NAME" --data '{"token":"<YOUR SLACK VERIFICATION TOKEN>","text":"Some message from Slack!"}'
```



## Local testing

```shell
# NOTE: use the locally installed functions emulator.
alias functions='./node_modules/.bin/functions'

# NOTE: start the emulated server.
functions start

functions deploy "$PROJECT_FUNCTION_NAME" --trigger-http --timeout "540s"

# NOTE: enable mocking of dependencies.
# TODO: avoid this total hack, when @google-cloud/functions-emulator improves mocking.
cp "./test/mocks.js" "./node_modules/@google-cloud/functions-emulator/mocks.js"

# NOTE: start debugging, wait for debugger.
# NOTE: easiest debugging is in built into Google Chrome.
# chrome://inspect/#devices
functions inspect "$PROJECT_FUNCTION_NAME" --pause

# NOTE: test against the local function.
functions call "$PROJECT_FUNCTION_NAME" --data '{"token":"<YOUR SLACK VERIFICATION TOKEN>","text":"Some message from Slack!"}'

# NOTE: clear the server and stop when done developing.
functions clear
functions start
```



## Development

Patches welcome! Please follow [git-flow](https://danielkummer.github.io/git-flow-cheatsheet/) when submitting pull requests.



---

<a href="https://vidy.com/"><img src="./resources/icon/vidy-icon-82x80.png" alt="The VIDY logotype" width="16" height="16" border="0" /></a>
❤️
<a href="https://slack.com/"><img src="./resources/icon/slack-icon-256x256.png" alt="The Slack logotype" width="16" height="16" border="0" /></a> [vidy-slack-bot](https://joelpurra.com/projects/vidy-slack-bot/) Copyright &copy; 2018 [Joel Purra](https://joelpurra.com/). Released under [GNU Affero General Public License version 3.0 (AGPL-3.0)](https://www.gnu.org/licenses/agpl.html). [Your donations are appreciated!](https://joelpurra.com/donate/)
