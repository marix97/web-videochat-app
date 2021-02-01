# Video Chat application
## Targeted framework .NET Framework 4.7.2

### Overview
In order to have access to the video calls, the OpenVidu application must be put in a Docker container with the following command 
```docker run -p 4443:4443 --rm -e OPENVIDU_SECRET=MY_SECRET openvidu/openvidu-server-kms:2.15.0```
The application will work even if the OpenVidu application is not turned on but the user won't be able to have video-conference calls with the other participants in his room.

SignalR is used for the real-time chat application. It is an open-source Microsoft library that allows server code to send asynchronous notifications to client-side web applications.
Note that there are some problems with the OnDisconnected() SignalR method that doesn't fire for some reasons on non-Chromium based browsers. It's recommended to use only Chromium based browsers.

The application is only accessible after an user registered themselves, then confirmed their emails and then they should authorize themselves with their credentials. There is also logic for forgotten password implemented and validation during registration.
For the database creation, authorization and athentication, the application uses ASP.NET Identity.

More features:
- Private messaging - through the command /private (username)
- Sending and downloading files
- Creation of rooms with password and without
- Rooms are deleted automatically when the user exits them or joins another one and there's no one in that room (OnDisconnected() method should be fired for that)
- Video calls only within the same room

Client-side logic is written in signalr.js and the back-end logic that's specific about the chat is in ChatHub.cs.
