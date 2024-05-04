# Information on game

This was written as a traditional old-school platformer based on sprites and a built in simplistic physics engine. It is all written in plain Javascript without use of any library. 

Maps in the game are created using a standard painting program, where the different parts of the level are color coded. 

When read into the game, the map is converted into a quad-tree, for efficiency, and the ability to have large/huge levels.

# How to run

npm install
node start.js

The game is served on http://localhost:3000 !


# How to play

Jump with space, control with arrow buttons. You an grab on to walls, and jump from walls as well. 

I think ever third jump, your character will do a sumersault.

There is a fun jump glitch that allows you to accellerate if jumping back and forth between close walls. 