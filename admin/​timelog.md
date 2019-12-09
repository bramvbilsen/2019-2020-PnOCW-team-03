# Timelog

### Taakverdeling:

- CEO: Liam Volckerick
- CTO: Adam El M'Rabet
- TC1: Bram Vanbilsen
- TC2: Sebastiaan Wouters
- Code reviewer 1: Maarten Pyck
- Code reviewer 2: Pieter-Jan Van den Broecke

### **Log**:

##### 5/10:

###### -Worked on implementing a basic js. script that displays an uploaded image to our client + made sure we separated back end from front end. 

###### -The client (our front end) is made as a separate project within our root, called public. 

TC1: 2h

CEO: 2h



##### 7/10:

###### -Made a connection between users and server, identifying each and every user using socket.io. 

###### -Accessed a user's camera and was able to capture the videoframe and uploading it to our backend.

All: 5hours



##### 10/10:

###### -CT2 & code reviewer worked on implementing a pixel detection algorithm based on given algorithm from the professor

###### -CT1 worked on finishing the image upload to the server as a blob and png

###### -CEO & CTO made sure we can display arrows to the slaves from the master via the google console.

All: 3 Hours



##### 12/10:

###### - Bugfixes on image upload

TC1: 3Hours



##### 13/10: 

###### -Bug fixes and refactors by TC1

###### -CEO worked on report and code review

###### -code review by code reviewer

###### -task 3 algorithm further research.

TC1: 3 Hours

CEO: 2,5 Hours

Code Reviewer: 1,5 Hours

TC2: 3 Hours



##### 14/10: 

###### -Refactoring of the build/app by TC1&CTO

###### -Working out the algorithm for task 3, basic ideas by the CEO, TC2, Code reviewers

All: 4hrs



##### 17/10:

###### -Refactor done

###### -CTO worked on researching houghes theorem 

###### -TC1, CEO, Code reviewers and TC2 worked on other implementations regarding screen recognition in computer vision. Choosing what language? How exactly?

CC2: 3hrs

CC1 & TC2: 3hrs

TC1: 4hrs

CTO: 4hrs

CEO: 4hrs



##### 19-20/10:

###### -TC1: worked on detecting colors displayed on a screen, extracting that screen into isolation and computing the edges of the displayed screen image.

###### -CEO: based on the output TC1 could provide, detected the corners for the given edges and output the img corners on the original image + its coordinates. (Harris corner detection)

###### -CTO: Implemented Houghes algorithm to detect all edges given an image. -> second algorithm for edge detection

TC1: 8hrs

CEO: 6hrs

CTO: 6hrs



##### 21/10:

###### -Code reviewers: Code review.

###### -The rest worked on the assembly of all 4 algorithms to form a cohesive working algorithm for corner detection.  Writing the report with all four of us. 

Code reviewers: 4hrs +(1.5h on the 22nd)

CTO: 6hrs

CEO: 7hrs

TC1: 7hrs

TC2: 7hrs



##### 24/10:

###### -CEO, CR1 & CR2: Research and the beginning of triangulation

###### -CTO implementing ui for slave and master

###### -TC1: Refactoring the original corner detection alg.

###### -TC2: Convex hull algorithm

All: 4hrs



##### 07/11:

###### -CEO&CR2: Thinking about cat casting an image, creating a workflow which can lead to a working algorithm.

###### -TC1&TC2: Working further on orientation detection implementation

CEO,TC1&2,CR2: 4Hrs
CTO&CR1 sick at home.



##### 11/11:

###### -CEO: Working on smallest bounding box in all directions for given set of points.

###### -CTO: implementing timesynchronization for countdown

###### -Code reviewer 1: helping with countdown

###### -TC1: Writing testcases

###### -TC2: Working with CEO on perspective transformation
CEO: 6hrs

CTO: 4hrs

TC1: 6hrs

TC2: 6hrs

Code reviewer 1: 1hrs

Code reviewer 2: 2,5hrs



##### 12/11:

###### -CEO: Writing report and debate with TC2&CR2 around the workflow for cat casting.

###### -CTO implementing timesynchronization for countdown

###### -Code reviewer 1: writing report.

CEO: 6hrs

CTO: 6hrs

TC1: 8hrs

TC2: 6hrs

Code reviewer 1: 3hrs

Code reviewer 2: 6hrs




##### 14/11:
###### -CEO,TC2,CR2: Working with around the workflow for cat casting. Trying to finish the affine transformation algorithm.

###### -CTO: Designing our design schematics in a flowchart/deployment diagram.

###### -TC1: Writing tests and optimizing the corner detection algorithm.

###### -CR1: Debugging triangulation.

CEO: 2,5 hrs

CTO: 2 hrs

TC1: 4 hrs

TC2: 3 hrs

CR1&CR2: 3 hrs



##### 15/11:

###### -TC1:  Worked further on screen detection (removing outliers), worked on test suite (running individual tests) and started making a cutting algorithm for simple cases 

TC1: 4hrs



##### 16/11:

###### -CEO:  Tried fixing and completing the basic img cutter for img casting 

###### -TC2:  using opencv.js to implement the tranformation to rectangle 

###### -TC1:  Worked on all aspects of image cutting algorithm (cutting, rotation, scaling, casting) except for perspective 

CEO: 2h

TC1: 10h

TC2: 3h



##### 17/11:

###### -CEO:  Worked on the cutting part of the algorithm for img casting, afterwards testing and helping Bram 

###### -TC1:  Worked on all aspects of image cutting algorithm (cutting, rotation, scaling, casting) except for perspective 

###### -TC2:  trying to find bugs in orientation detection 

###### -CR1:  Screendetection debugging

###### -CR2: trying to find and solve problems regarding importing openCV to js

CEO:6h

TC1:10h

TC2: 6h30

CR1: 6h

CR2: 2h



##### 18/11:

###### CEO&TC1: Preparations for demo and worked on perspective for image casting

###### CTO:  Preparations for demo and worked on cutting and rescaling of images 

###### CR2: Display triangulatie herstellen en werking display testen 

###### CR1?TC2? didnt update their timelog on that day.. They cant remember what they did, but they were there all day with the rest working. 

ALL: 6h



##### 20/11:

###### -TC2:  trying to rewrite parts of orienation detection 

TC2: 2h30



##### 21/11:

###### -CEO:  Created a sheet for all of us to keep track of work done and deadlines. + First look at orientation 

###### -CTO:  Orientation trying to fix problem and made some test cases 

###### -TC1:  Worked on triangulation without casting, i.e.: calculating angles for individual slaves to easily display them on slave screens after some translation 

###### -TC2: ?? Did not update the timelog

###### -CR1: ?? Did not update the timelog

###### -CR2:  Discussing agenda + timelog + testing the principles of the simulation of the snake.

CEO: 3h 

CTO: 3h

TC1: 4h

CR2: 4h



##### 22/11:

###### -TC2:  using the transform function in css to complete the perspective transform ***2H***



##### 23/11:

###### -CEO:  Possibly found a solution for orientation detection, yet to implement with Adam ***1H***

###### -TC1:  Worked server: Feature to change master once server is started + Feature to reset master after master started slave flow ***2H30***



##### 24/11:

###### -CR1:  Extra informatie berekenen van triangulatie voor animatie ***4H***

###### -CR2:  Start klassen voor animatie cirkel [EdgePoint.ts, Entity.ts en GraphSimulator.ts]  ***2H***



##### 25/11: 

###### -CEO:  worked on fixing orientation detection alternative by detecting colors in first 2 quadrants & testing+timelog updated ***7H***

-CTO:  ?? did not update timelog

###### -TC1:  Finally found and fixed incorrect range bug (screen detection) & orientation detection algorithm ***6H30***

###### -TC2:  completing timelog + improving image transformation ***4H***

-CR1: ?? did not update timelog

###### -CR2:   Beweging van een punt afgewerkt en extra functionaliteit toegevoegd aan point [Entity.ts, GraphSimulator.ts en Point.ts]  ***5H***



##### 26/11:

###### -CEO: Reworked orientation detection alternative to use 4 corners to detect colors and its orientation  ***1H***

###### -TC1:  Added interactive canvas for triangulation and added ability to reset master without using the console (press "r")  ***1H30***



##### 27/11:

###### -TC1:  Worked on automating our SlaveFlowHandler (mostly finished, but there is a small bug somewhere) & added a method to kick slaves and the master from the server's terminal ***3H***

###### -CR1:  implementing functions for creating animation ***2H***



##### 28/11:

###### -CEO:  Testing/debugging orientation detection + writing tests  ***3H***

###### -CTO:  Countdown scaling of numbers ***3H30***

###### -TC1:  Searched and fixed orientation point modification bug & tested on server ***3H***

###### -TC2: bugs fixing ***2H30***

-CR1: ?? did not update timelog

###### -CR2:  Tooltips added to buttons + simulatiion code reviewed[index.html, Entity.ts en GraphSimulator.ts]  ***3H***



##### 30/11:

###### TC1:  Implemented calculation for 3d transformation matrix  ***3H***



##### 2/12:

###### -CEO:  reworked calculateOrientation such that the angle calculation also takes into account of the orientation type. First steps to reworking angle calculation ***3H30*** 

-CTO: ?? Did not update timelog

###### -TC1:  Worked on animation ***9H***

-TC2: ?? Did not update timelog

###### -CR1:  eerste keer animatie testen + bugs fixen ***9H***

###### -CR2:  Implementeer een 2de manier om de circel te doen bewegen (met image casting) + debuggen eerste manier + Fix multiple masters bug ***9H***



##### 4/12:

###### -CEO:  First ideas for angle calculations regarding orientation type, testing theories+writing the code ***4H***



##### 5/12:

###### -CEO:  Implementing the first version of angle detection regardin orientation in slaveScreen.ts+report start ***5H***

###### -CTO:   Writing final report ***1H***

###### -TC1:  Animation and angle detection ***7H30***

###### -TC2:  Creating structure of the report and start writing ***3H***

###### -CR1:  Laatste bugs in animatie fixen ***7H30***

###### -CR2:  Testen animatie + begin eindverslag ***14h30***



##### 6/12:

###### -CEO:   writing final report X  ***9H***

###### -CTO:  Correcting small problem with creeper display after countdown + Writing final report ***4,5H***

###### -TC1:  Rotation + image cutting + report ***14H***

###### -TC2:  Writing final report ***10H***

###### -CR1:  Meewerken aan rotatie detection + cutting iemages + final report ***14H***

###### -CR2:  Verslag schrijven ***4H***