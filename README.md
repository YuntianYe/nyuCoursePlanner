# nyuCoursePlanner
A Python Based NYU Course Planner

### Deploy

#### Install Prerequisite

##### Support
 - Node.js
 - Python3
 - Git
 
##### Python Library
 - selenium
 - Chrome WebDriver (Standalone)

#### Clone the Workspace

```bash
  git clone https://github.com/NHibiki/nyuCoursePlanner.git
  cd nyuCoursePlanner
```

#### Install NPM Dependent Library

```bash
  npm install
```

#### Build Online Course Library

```bash
  npm run build
```

    In the base folder, you can see a file "nyucourse.json" generated.
    Move it to albert folder, rename to whatever you want.
    Then add the json filename to "config.json"

#### Run the Server

```bash
  npm run start
```

    The default port is 8080
    If you want to change this PortNum
    Please add one more argument when type the command.
    For example, to run on port 80.

```bash
  sudo npm run start 80
```

<p style="color:red">Be Aware! If you run server on a small port num, please guarantee ROOT permission!</p>

Enjoy!

## LICENCE

THE WORK (AS DEFINED BELOW) IS PROVIDED UNDER THE TERMS OF THIS CREATIVE COMMONS PUBLIC LICENSE ("CCPL" OR "LICENSE"). THE WORK IS PROTECTED BY COPYRIGHT AND/OR OTHER APPLICABLE LAW. ANY USE OF THE WORK OTHER THAN AS AUTHORIZED UNDER THIS LICENSE OR COPYRIGHT LAW IS PROHIBITED.

BY EXERCISING ANY RIGHTS TO THE WORK PROVIDED HERE, YOU ACCEPT AND AGREE TO BE BOUND BY THE TERMS OF THIS LICENSE. TO THE EXTENT THIS LICENSE MAY BE CONSIDERED TO BE A CONTRACT, THE LICENSOR GRANTS YOU THE RIGHTS CONTAINED HERE IN CONSIDERATION OF YOUR ACCEPTANCE OF SUCH TERMS AND CONDITIONS.
