# Project Delphi

Project Delphi exists to provide a a quick statistical and visual insight into the world of Fantasy Football. Offering a fully customizable scatterplot and radar chart, with data from the NFL across the past 9 seasons. Giving the user the option to choose their interested statistics, and quickly compare players on the fly. You can use it during the draft, during the season for Free Agents, or even just to settle a bet.

![Demo 1](https://github.com/JGibel/Delphi/blob/master/demo/demo2.gif)

After looking online, I didn't see much in the way of good data visualization and fantasy football. And with how much time I was spending on the game, I figured I might as well code the specific comparisons I always try to keep in mind. 

Users come onto a page displaying the top n number of players and their selected stats for quick comparisons.

![Screen 1](https://github.com/JGibel/Delphi/blob/master/demo/screen1.PNG)

The user is able to modify their selections for both the table, and the graphs based on the configuration page and the tabs on the statistics table.

For Example, to compare running backs and see specifically how they also do on receptions, I would see the following page:
![Screen 2](https://github.com/JGibel/Delphi/blob/master/demo/screen2.PNG)

### Prerequisites
Project Delphi is based on the wonderful work of BurntSushi's [nfldb](https://github.com/BurntSushi/nfldb) and the fantastic people who support it. It's a python script/PostgreSQL database that serves as the schema for all the nfl stats, plays, players, teams as well as the mechanism for retrieving and updating that database. 

PostgreSQL, node.js, and npm are also required as the database, backend server, and dependency management respectively.

### Running Delphi
Simply run the command
```
node index.js
``` 
to start running. The page is served by default on port 3000. So localhost:3000 should be able to get you there.

### Design Decisions
The underlying UI framework is Angular 1.3, simply for the purpose of familiarity in how it works. 

[d3js](https://d3js.org/) serves as the libgary for the data visualization. It works with data really easily, and is probably the easiest library of this nature that I've used once you get past the initial learning hump of what enter, and exit really mean in the d3 world. 

[Bootsrap v4](https://getbootstrap.com/docs/4.0/getting-started/introduction/) is the css magic maker, with [ionicons](https://ionicons.com/) providing the svg icons ever since they excluded them from bootsrap by default.

Express serves as the rest layer, with [pg-promise](https://github.com/vitaly-t/pg-promise) allowing database interactions in a injection safe way.

And as with every project, there's a little jQuery mixed in, both directly and indirectly, because it's almost impossible to not use it.

Most of these technologies were chosen out of convenience and ease of use, as well as being fairly well documented libraries so that if issues did arise, I'm not alone in my problems. No grunt or gulp yet, because there's less than ten html, js, and css files each, so not much is to be gained in compilation.

### Road Map
In no particular order:

* Full support for other positions, including kickers and defenses
* User inputtable scoring rules, which inform the intial selection for top players. The backend code supports it, just a matter of putting it in the configuration
* Use cookies or local storage for persiting user configuration
* Allow integration with user's actual league, to allow filtering by available players, fantasy teams, price, etc.