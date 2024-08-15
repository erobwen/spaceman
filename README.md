# Overview

This game was written as a traditional old-school platformer based on sprites and a built in simplistic physics engine. It is all written in plain Javascript without use of any library. It is just a tech demo and not a finished game. 


# Technical

Maps in the game are created using a standard painting program, where the different parts of the level are color coded. 

When read into the game, the map is converted into a quad-tree, for efficiency, and the ability to have large/huge levels.

Dynamic aspect oriented programming was used instead of OOP to build this game engine.


# How to run

npm install
node start.js

The game is served on http://localhost:3000 !


# How to play

Jump with space, control with arrow buttons. You an grab on to walls, and jump from walls as well. 

Every third jump, your character will do a sumersault.

There is a fun jump glitch that allows you to accellerate if jumping back and forth between close walls. Is it a bug or a feature? 


# Screenshot

![Alt text](/screenshot.png?raw=true "Screenshot")


# Demo

https://www.youtube.com/watch?v=ZaMmq4ErIeU
