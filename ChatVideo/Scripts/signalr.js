$(function () {
    // Reference the auto-generated proxy for the hub.
    var chat = $.connection.chatHub;
    var OPENVIDU_SERVER_URL = "https://" + location.hostname + ":4443";

    var OPENVIDU_SERVER_SECRET = "MY_SECRET";
    var OV;
    var session;


    chat.client.addNewMessageToPage = function (name, message) {
        console.log("New msg to page " + name + " " + message)
        var today = new Date();
        var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        var dateTime = date + ' ' + time;
        // Add the message to the page.
        $('#chatbox').append('<li> <strong> [' + [dateTime] + '] </strong> <strong>' + name
            + '</strong>: ' + message + '</li>');
    };

    chat.client.disconnected = function (name) {
        console.log("disconnected " + name);
        $(".user[data-user-name='" + name + "']").remove();
        $('#chatbox').append("<br/><span class='text-muted text-small'>" + htmlEncode(name) + " has left the chat</span>");
    };

    chat.client.connected = function (name) {
        console.log("connected " + name);
        //$("#users").append("<li class='user' data-user-name='" + name + "'>" + name + "</li>");
        $('#chatbox').append("<br/><span class='text-muted text-small'>" + htmlEncode(name) + " has entered the chat. He/She is in lobby.</span>");
    };

    chat.client.wrongPassword = function () {
        alert("Wrong password");
    };

    chat.client.roomCreated = function (name) {
        console.log("room created " + name);

        $('#rooms').append("<div><button type='button' class='btn btn-sm btn-info room-click' data-room-name='" + name + "' class='text-muted text-small'>" + htmlEncode(name) + "</button></div>");
        $('#chatbox').append("<br/><span class='text-muted text-small'> room " + htmlEncode(name) + " has been created</span>");
    };

    chat.client.updateActiveUsers = function (users) {
        console.log("user update ");
        console.log(users);
        for (let user of users) {
            $("#users").append("<li class='user' data-user-name='" + user + "'>" + user + "</li>");
        }

    };

    chat.client.userIsOffline = function (name) {
        alert("User " + name + " is offline.");
    };

    chat.client.roomDestroyed = function (name) {
        console.log("room destroyed " + name);
        $(".room-click[data-room-name='" + name + "']").parent().remove();
    };

    chat.client.userLeftThisRoom = function (user) {
        $(".user[data-user-name='" + user + "']").remove();
        $('#chatbox').append("<br/><span class='text-muted text-small'>" + htmlEncode(user) + " has left this room</span>");
    }

    chat.client.userJoinedThisRoom = function (user) {
        $("#users").append("<li class='user' data-user-name='" + user + "'>" + user + "</li>");
        $('#chatbox').append("<br/><span class='text-muted text-small'>" + htmlEncode(user) + " has entered this room</span>");
    }

    chat.client.sendPrivateMessage = function (name, message) {
        var today = new Date();
        var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        var dateTime = date + ' ' + time;

        $('#chatbox').append('<li> <strong> [' + [dateTime] + '] </strong><strong>' + name
            + '</strong> (Private message): ' + message + '</li>');;
    };

    chat.client.onError = function () {
        alert("Wrong private messaging format or user is not online.");
    };

    chat.client.roomLengthInvalid = function () {
        alert("The length of the rooms must be between 5 and 35 characters.");
    };

    chat.client.successJoinRoom = function (roomName) {
        $("#chatbox").html("<br/><span> You joined " + roomName + "</span>").attr("data-room-name", roomName);
        $("#join-room-modal").modal("hide");
        $("#users").html("");
        chat.server.getAllUsersInGroup(roomName).done(function (users) {
            console.log("here everyone in this groups");
            console.log(users);
            $.map(users, function (user) {
                $("#users").append("<li class='user' data-user-name='" + user + "'>" + user + "</li>");
            });
        });
    }

    // Set initial focus to message input box.
    $('#chatbox-input-text').focus();

    $("#create-room").click(function () {
        let roomName = $("#room-name").val();
        let roomPassword = $("#room-password").val();
        chat.server.createRoom(roomName, roomPassword);
        $("#room-modal").modal("hide");
    });

    $('#chatbox-input-button').click(function () {

        // Call the Send method on the hub.
        if ($("#chatbox-input-text").val().trim()) {
            let roomName = $("#chatbox").attr("data-room-name");
            chat.server.send($('#chatbox-input-text').val(), roomName);
        }

        // Clear text box and reset focus for next comment.
        $('#chatbox-input-text').val('').focus();
    });

    $(document).on("click", ".room-click", function () {
        $("#join-room-button").attr("data-room-name", $(this).attr("data-room-name"));
        $("#join-room-modal").modal("show");
    });

    $(document).on('click', '#join-room-button', function () {
        leaveSession();
        console.log("here");
        let attemptedPassword = $("#join-room-password").val();
        let roomName = $(this).attr("data-room-name");
        chat.server.joinRoom(roomName, attemptedPassword);
    });

    $.connection.hub.disconnected(function () {
        console.log('disconnect called');
    });

    $.connection.hub.start(
        { transport: ['webSockets', 'longPolling'] }).done(function () {
          
            $("#users").html(" ");
            chat.server.getAllUsersInGroup("lobby").done(function (connections) {
                console.log(connections);
                for (let user of connections) {
                    $("#users").append("<li class='user' data-user-name='" + user + "'>" + user + "</li>");
                }
             
            });

            chat.server.getAllGroupsNames().done(function (groups) {
                console.log(groups);
                $.map(groups, function (group) {
                    $('#rooms').append("<br><button type='button' class='btn btn-sm btn-info room-click' data-room-name='" + group + "' class='text-muted text-small'>" + htmlEncode(group) + "</button>");
                });
            });
            chat.server.joinRoom("lobby");

        });

    $('#upload-file').on('click', function () {
        var form = $("#fileinfo").get(0); 
        $.ajax({
            url: '/home/uploadfile',
            type: 'POST',
            data: new FormData(form),
            success: function (data) {
                $('#output').html(data.status);
                if (data.status = "ok") {
                    let roomName = $("#chatbox").attr("data-room-name");
                    let message =  htmlEncode(data.filename) + " file has been uploaded. Click <a href='home/download/?filename=" + data.filename + "' id='download-file' data-file='" + data.filename + "'> HERE to download.</a>";
                    chat.server.send(message, roomName);
                    $(".modal").modal("hide");
                }
            },
            cache: false,
            contentType: false,
            processData: false
        });
    });

// This optional function html-encodes messages for display in the page.
function htmlEncode(value) {
    var encodedValue = $('<div />').text(value).html();
    return encodedValue;
}


// VIDEO CHAT LOGIC
    function initVideo() {
        let roomName = $("#chatbox").attr("data-room-name");
        let userName = $("#chatbox").attr("data-user-name");
        let mySessionId = roomName;   // Session the user will join
        let myUserName = userName;     // Nickname of the user in the session

        // --- 1) Get an OpenVidu object ---
        OV = new OpenVidu();
        // --- 2) Init a session ---
        session = OV.initSession();

        // --- 3) Specify the actions when events take place in the session ---

        // On every new Stream received...
        session.on('streamCreated', event => {

            // Subscribe to the Stream to receive it. HTML video will be appended to element with 'video-container' id
            var subscriber = session.subscribe(event.stream, 'video-container');

            // When the HTML video has been appended to DOM...
            subscriber.on('videoElementCreated', event => {

                // Add a new <p> element for the user's nickname just below its video
                appendUserData(event.element, subscriber.stream.connection);
            });
        });

        // On every Stream destroyed...
        session.on('streamDestroyed', event => {
            // Delete the HTML element with the user's nickname. HTML videos are automatically removed from DOM
            removeUserData(event.stream.connection);
        });

        // --- 4) Connect to the session with a valid user token ---

        // 'getToken' method is simulating what your server-side should do.
        // 'token' parameter should be retrieved and returned by your own backend
        getToken(mySessionId).then(token => {

            // First param is the token got from OpenVidu Server. Second param can be retrieved by every user on event
            // 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
            session.connect(token, { clientData: myUserName })
                .then(() => {

                    // --- 6) Get your own camera stream with the desired properties ---

                    var publisher = OV.initPublisher('video-container', {
                        audioSource: undefined, // The source of audio. If undefined default microphone
                        videoSource: undefined, // The source of video. If undefined default webcam
                        publishAudio: true,     // Whether you want to start publishing with your audio unmuted or not
                        publishVideo: true,     // Whether you want to start publishing with your video enabled or not
                        resolution: '640x480',  // The resolution of your video
                        frameRate: 30,          // The frame rate of your video
                        insertMode: 'APPEND',   // How the video is inserted in the target element 'video-container'
                        mirror: false           // Whether to mirror your local video or not
                    });

                    // --- 7) Specify the actions when events take place in our publisher ---

                    // When our HTML video has been added to DOM...
                    publisher.on('videoElementCreated', function (event) {
                        initMainVideo(event.element, myUserName);
                        appendUserData(event.element, myUserName);
                    });

                    // --- 8) Publish your stream ---

                    session.publish(publisher);
                    $("#chatbox-video-button").css("display", "none");
                    $("#chatbox-video-off-button").css("display", "block");

                })
                .catch(error => {
                    console.log('There was an error connecting to the session:', error.code, error.message);
                });
        });
    }

    $("#chatbox-video-off-button").click(function () {
        leaveSession();
    });

    $("#start-video").click(function () {
        initVideo();
        $(".modal").modal("hide");
    });

    function leaveSession() {
        // --- 9) Leave the session by calling 'disconnect' method over the Session object ---
        if (session)
            session.disconnect();
        $("#chatbox-video-button").css("display", "block");
        $("#chatbox-video-off-button").css("display", "none");
        clearMainVideo();
    }

    window.onbeforeunload = function () {
        if (session) session.disconnect();
    };

 
    function appendUserData(videoElement, connection) {
        var userData;
        var nodeId;
        if (typeof connection === "string") {
            userData = connection;
            nodeId = connection;
        } else {
            userData = JSON.parse(connection.data).clientData;
            nodeId = connection.connectionId;
        }
        var dataNode = document.createElement('div');
        dataNode.className = "data-node";
        dataNode.id = "data-" + nodeId;
        dataNode.innerHTML = "<p>" + userData + "</p>";
        videoElement.parentNode.insertBefore(dataNode, videoElement.nextSibling);
        addClickListener(videoElement, userData);

    }

    function addClickListener(videoElement, userData) {
        videoElement.addEventListener('click', function () {
            var mainVideo = $('#main-video video').get(0);
            if (mainVideo.srcObject !== videoElement.srcObject) {
                $('#main-video').fadeOut("fast", () => {
                    $('#main-video p').html(userData);
                    mainVideo.srcObject = videoElement.srcObject;
                    $('#main-video').fadeIn("fast");
                });
            }
        });
    }

    function initMainVideo(videoElement, userData) {
        document.querySelector('#main-video video').srcObject = videoElement.srcObject;
        $("#main-video p").html(userData);
    }

    function clearMainVideo() {
        document.querySelector('#main-video video').srcObject = null;
        $(".data-node p").html("");
        $("#main-video p").html("");
    }

    function removeUserData(connection) {
        var dataNode = document.getElementById("data-" + connection.connectionId);
        dataNode.parentNode.removeChild(dataNode);
    }

    //OPENVIDU settings below

function getToken(mySessionId) {
    return createSession(mySessionId).then(sessionId => createToken(sessionId));
}

function createSession(sessionId) { // See https://docs.openvidu.io/en/stable/reference-docs/REST-API/#post-apisessions
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: OPENVIDU_SERVER_URL + "/api/sessions",
            data: JSON.stringify({ customSessionId: sessionId }),
            headers: {
                "Authorization": "Basic " + btoa("OPENVIDUAPP:" + OPENVIDU_SERVER_SECRET),
                "Content-Type": "application/json"
            },
            success: response => resolve(response.id),
            error: (error) => {
                if (error.status == 409) {
                    resolve(sessionId);
                } else {
                    console.warn('No connection to OpenVidu Server. This may be a certificate error at ' + OPENVIDU_SERVER_URL);
                    if (window.confirm('No connection to OpenVidu Server. This may be a certificate error at \"' + OPENVIDU_SERVER_URL + '\"\n\nClick OK to navigate and accept it. ' +
                        'If no certificate warning is shown, then check that your OpenVidu Server is up and running at "' + OPENVIDU_SERVER_URL + '"')) {
                        location.assign(OPENVIDU_SERVER_URL + '/accept-certificate');
                    }
                }
            }
        });
    });
}

function createToken(sessionId) { // See https://docs.openvidu.io/en/stable/reference-docs/REST-API/#post-apitokens
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: OPENVIDU_SERVER_URL + "/api/tokens",
            data: JSON.stringify({ session: sessionId }),
            headers: {
                "Authorization": "Basic " + btoa("OPENVIDUAPP:" + OPENVIDU_SERVER_SECRET),
                "Content-Type": "application/json"
            },
            success: response => resolve(response.token),
            error: error => reject(error)
        });
    });
    }
    
}); 