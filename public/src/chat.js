// constants
var chatBarDefault = "0px";
var chatBarOpen = "425px";
var roomColors = {
    selected: "rgba(217, 220, 229)",
    unselected: "rgba(150, 150, 170)"
};

class Room {
    constructor(id, displayName) {
        this.id = id
        this.displayName = displayName,
            this.input, this.output = "";
    }
}

// chat variables
var maxChats = 4;
var chatRooms = {};
var requestedRoom = false;
joinRoom("Global");
var currentChat = requestedRoom;

function setupChat() {
    $("#chat-bar").on("click", e => {
        e.preventDefault();
        switch (e.which) {
            case KEYCODE.LEFT_CLICK:
                toggleChat();
                break;
        }
    });

    $("#roomButton").on("click", e => {
        if (requestedRoom) {
            addServerMessage("You already have a room join request in queue.", currentChat.id);
        } else if (countRooms() >= maxChats) {
            addServerMessage("You've joined the maximum number of chats at a time.", currentChat.id);
        } else {
            let roomInput = $("#roomInput").val();
            if (roomInput) {
                joinRoom(roomInput);
                $("#roomInput").val("");
            }
            else addServerMessage("Please enter the name of the room you would like to join.", currentChat.id);
        }
    });

    $("#chatInput").on("keypress", e => {
        // check ENTER
        if ($("#chatInput:focus") && $("#chatInput").val() && e.which === KEYCODE.ENTER) {
            // send chat to server
            let typedMessage = $("#chatInput").val();
            if (typedMessage == "/ping") {
                addServerMessage("Your ping is " + latency + "ms.", currentChat.id);
            } else {
                socket.emit("chatMessage", { room: currentChat.id, msg: typedMessage });
            }
            // clear chat
            $("#chatInput").val("");
        }
    });
}

function toggleChat() {
    $("#chat-body").stop().slideToggle(200);
}

function addChatMessage(user, msg, room) {
    addTextToChat("<b>" + user + ":</b><text> " + msg + "</text>", room);
}

function addServerMessage(msg, room) {
    addTextToChat("<text style='color:red;'>" + msg + "</text>", room);
}

function addTextToChat(text, room) {
    chatRooms[room].output += text + "<br>";
    updateCurrentChat();
}

function countRooms() {
    return Object.keys(chatRooms).length;
}

function joinRoom(room) {
    requestedRoom = new Room(room.toLowerCase(), room);
    socket.emit("joinRoom", { requestedRoom: requestedRoom.id });
}

function selectChat(chat) {
    $("#select" + currentChat.displayName).css({ "background-color": roomColors.unselected, "border-bottom-style": "solid" });
    currentChat.input = $("#chatInput").val();
    $("#select" + chat.displayName).css({ "background-color": roomColors.selected, "border-bottom-style": "none" });
    $("#chatInput").val(chat.input);
    currentChat = chat;
    updateCurrentChat();
}

function updateChatRooms() {
    let roomsHTML = "";
    for (let room in chatRooms) {
        let displayName = chatRooms[room].displayName;
        roomsHTML += `<div id="select${displayName}" class="selectRoom" name="room" onclick="selectChat(chatRooms['${room}'])">${displayName}</div>`;
    }
    $("#chat-rooms").html(roomsHTML + "<div id='chatRoomPadding' style='width:" + (296 - 62 * countRooms()) + "px'></div>");
}

function updateCurrentChat() {
    $("#chatText").html(currentChat.output);
    $("#chatText")[0].scrollTo(0, $("#chatText")[0].scrollHeight);
}