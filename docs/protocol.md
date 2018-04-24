> Note: A red circle :red_circle: marks internal notes which won't appear in the final version.

The RIDE protocol is formed of messages sent in either direction over a TCP connection.

A message starts with a 4-byte big-endian *total length* field, followed by the ASCII bytes for `"RIDE"` and a
UTF-8-encoded payload:
```
    8+len(payload)   "RIDE" magic number   payload
┌───────────────────┬───────────────────┬─────~─────┐
│0x00 0x00 0x00 0x0b│0x52 0x49 0x44 0x45│    ...    │
└───────────────────┴───────────────────┴─────~─────┘
```
*Total length* is 8 + the payload's length in bytes.
The payload is almost always a 2-element JSON array consisting of a command name and arguments as key/value pairs:
```json
["CommandName",{"key1":"value1","key2":222,"key3":[3,4,5]}]
```
The only exception are the first two messages that each side sends upon establishing a connection.
These constitute the *handshake* and are not JSON-encoded.  Their payloads are:
```
SupportedProtocols=2
UsingProtocol=2
```

Messages are independent and after the handshake can be sent/received in any order. Some messages infer that the other
end will send a reply, but that reply may not be the next message to be received, or even ever be sent.

If the receiver of a message does not recognise it, it should respond with
```json
["UnknownCommand",{"name":"Xyz"}]
```

Should the interpreter generate an error during the processing of an incoming RIDE message it will respond with an InternalError message:

<a name=InternalError></a>
```json
["InternalError",{"error":1,"error_text":"WS FULL","dmx":"","message":"Edit"}]
```
* `error`: aka ⎕EN
* 'error_text: aka ⎕EM 
* 'dmx': the DMX message for the error (currently always empty)
* `message`: the name of the originating incoming RIDE message

The connection may be closed at any time, leaving some messages undelivered or unprocessed.

Command names and their arguments are case-sensitive.

JSON booleans `true` and `false` can be freely substituted with and should be treated as equivalent to `1` and `0`.


# Connection setup and teardown

After the connection has been established and a protocol agreed, both peers immediately send an `Identify` message to
indicate what type of application they are.

<a name=Identify></a>
```json
["Identify",{"identity":1}]
```
Constants for `identity`: `1` RIDE, `2` interpreter, `3` process manager.

:red_circle: The interpreter sends an `Identify` that means something else and has different args.

After it has received the Identify command the interpreter will send 0 or more "ReplyGetLog" messages containing the session log:
<a name=ReplyGetLog></a>
```json
["ReplyGetLog",{"result":["line 1","line 2"]}]
```

They should then check the type of application they are connected to, and if not happy to continue, close the
connection.  For instance, RIDE may check that the application it's connected to is an interpreter or a process
manager. If it finds the peer is another RIDE, it should close the connection.

:red_circle: In reality RIDE doesn't bother verifying that it's not talking to another RIDE.

If at any time the interpreter crashes with a
[syserror](http://help.dyalog.com/16.0/Content/Language/Errors/System%20Errors.htm), it
sends
<a name=SysError></a>
```json
["SysError",{"text":"apl: sys error 123 errno 456","stack":""}] // Interpreter -> RIDE
```

If the interpreter has been started by RIDE, RIDE should shut it down cleanly when the user closes the main application
window (the session window):
<a name=Exit></a>
```json
["Exit",{"code":0}] // RIDE -> Interpreter
```

# Session control
Any echoed input or interpreter output or the initial content of the session are sent to RIDE using
<a name=AppendSessionOutput></a><a name=EchoInput></a>
```json
["EchoInput",{"input":"      1 2 3+4 5 6\n"}] // Interpreter -> RIDE
["AppendSessionOutput",{"result":["5 7 9"]}]  // Interpreter -> RIDE
```
These two perform essentially the same task except that `AppendSessionOutput` doesn't have trailing `"\n"`-s at the end
of each element of `result`.

:red_circle: Sometimes the interpreter returns `"result"` as a string, other times as an array of strings.

The interpreter informs RIDE about changes in its ability to accept user input with
<a name=SetPromptType></a>
```json
["SetPromptType",{"type":5}] // Interpreter -> RIDE
```
Constants for `type`: `0` no prompt, `1` the usual 6-space APL prompt (a.k.a. Descalc or "desktop calculator"), `2`
[Quad(`⎕`)](http://help.dyalog.com/16.0/Content/Language/System%20Functions/Evaluated%20Input%20Output.htm) input, `3`
line editor, `4`
[Quote-Quad(`⍞`)](http://help.dyalog.com/16.0/Content/Language/System%20Functions/Character%20Input%20Output.htm) input,
`5` any prompt type unforeseen here.

:red_circle: These modes need explaining with expected behaviour.

When the user presses `<ER>` (Enter) or `<TC>` (Ctrl-Enter), RIDE sends
<a name=Execute></a>
```json
["Execute",{"text":"      1 2 3+4 5 6","trace":true}] // RIDE -> Interpreter
```
* `text`: the APL code to evaluate
* `trace`: whether the expression should be evaluated in the tracer (`<TC>`)

Note that RIDE can't assume that everything entered in the session will be echoed, e.g. quote quad input (`⍞`) doesn't
echo.  Therefore, RIDE should wait for the [`EchoInput`](#EchoInput) message.

If multiple lines have been modified in the session, RIDE should queue them up and send them one by one, waiting for
a response of either `SetPromptType` with `type>0` or
<a name=HadError></a>
```json
["HadError",{}] // Interpreter -> RIDE
```
RIDE should clear its queue of pending lines on `HadError` and focus the session.

RIDE can optionally advise the interpreter about the session's width in characters with
<a name=SetPW></a>
```json
["SetPW",{"pw":79}] // RIDE -> Interpreter
```
Further output will wrap at that width (with a few exceptions).
See [`⎕PW`](http://help.dyalog.com/16.0/Content/Language/System%20Functions/pw.htm).

# Window management
When the user presses `<ED>` (Shift-Enter), RIDE should send
<a name=Edit></a>
```json
["Edit",{"win":123,"text":"a←b+c×d","pos":4,"unsaved":{"124":"f"}}] // RIDE -> Interpreter
```
to request opening an editor.  `pos` is the 0-based position of the cursor in `text`.
`unsaved` is a mapping from window ids to unsaved content.

:red_circle: "Edit" must be extended to submit the current content of all dirty windows, otherwise jumping from one
method to another in a class will obliterate the current changes.

The interpreter will parse that and may respond later with one of
<a name=OpenWindow></a><a name=UpdateWindow></a>
```json
["OpenWindow",{"name":"f","text":["r←f a","r←(+⌿÷≢)a"],"token":123,"currentRow":0,"debugger":false,
               "entityType":1,"offset":0,"readOnly":false,"size":0,"stop":[1],
               "tid":0,"tname":"Tid:0"}] // Interpreter -> RIDE
["UpdateWindow",...] // Interpreter -> RIDE (same args as OpenWindow)
```
It may also send these in response to [`)ed
name`](http://help.dyalog.com/16.0/Content/Language/System%20Commands/ed.htm) or
[`⎕ed'name'`](http://help.dyalog.com/16.0/Content/Language/System%20Functions/ed.htm), as well as when tracing into an
object that is not currently being traced.

Constants for `entityType`: `1` defined function, `2` simple character array, `4` simple numeric array, `8` mixed simple
array, `16` nested array, `32` [`⎕OR`](http://help.dyalog.com/16.0/Content/Language/System%20Functions/or.htm) object,
`64` native file, `128` simple character vector, `256` APL namespace, `512` APL class, `1024` APL interface, `2048` APL
session, `4096` external function.

:red_circle: TODO: describe the other arguments

The interpreter can request transferring the focus to a particular window with
<a name=GotoWindow></a>
```json
["GotoWindow",{"win":123}] // Interpreter -> RIDE
```
This could happen as a result of `)ED` or `⎕ED`.

The interpreter may decide to change the type of a window (editor vs tracer) with
<a name=WindowTypeChanged></a>
```json
["WindowTypeChanged",{"win":123,"tracer":true}] // Interpreter -> RIDE
```

When the user presses `<EP>` (Esc), RIDE should request that the editor contents are fixed through
<a name=SaveChanges></a>
```json
["SaveChanges",{"win":123,"text":["r←avg a","s←+⌿a","n←≢a","r←s÷n"],"stop":[2,3]}] // RIDE -> Interpreter
```
`stop` is an array of 0-based line numbers.

The interpreter responds with
<a name=ReplySaveChanges></a>
```json
["ReplySaveChanges",{"win":123,"err":0}] // Interpreter -> RIDE
```
If `err` is 0, save succeeded; otherwise it failed.

RIDE can request that the intepreter reformat code:
<a name=FormatCode></a>
```json
["FormatCode",{"win":123,"text":["r←avg a","s←+⌿a","n ←    ≢a","r←s÷n"]}] // RIDE -> Interpreter
```

The interpreter will respond with:
<a name=ReplyFormatCode></a>
```json
["ReplyFormatCode",{"win":123,"text":["r←avg a","s←+⌿a","n←≢a","r←s÷n"]}] // Interpreter -> RIDE
```

Where the code has been formated per the interpreter's rules. 

* `win`: TENTATIVE: a window identifer. The interpreter needs a window in which to format the code (don't ask!). In the short term we'll insist that we can only format code in a window the interpreter is aware of.



When the user presses `<EP>` (Esc) and saving is successful or presses `<QT>` (Shift-Esc), RIDE sends
<a name=CloseWindow></a>
```json
["CloseWindow",{"win":123}] // RIDE -> Interpreter  and  Interpreter -> RIDE
```
but does not close the UI window until the interpreter replies with the same message.

To close all windows, but leave the SIstack unchanged RIDE can send the CloseAllWindows message.

<a name=CloseAllWindows></a>
```json
["CloseAllWindows",{}] // RIDE -> Interpreter
```
In response the interpreter will send a CloseWindow messsage for each window that it is aware of. The CloseAllWindows message will leave the SIStack unchanged, it will just close all (trace and edit) windows in the interpreter.

# Debugging
The following messages are used in relation to trace windows.
<a name=SetHighlightLine></a>
```json
["SetHighlightLine",{"win":123,"line":45}] // Interpreter -> RIDE
```
tells RIDE where the currently executed line is.  Traditionally that's indicated by a red border around it.

<a name=SetLineAttributes></a>
```json
["SetLineAttributes",{"win":123,"stop":[2,3,5]}] // RIDE -> Interpreter  or  Interpreter -> RIDE
```
Update the breakpoints.

`stop` is an array of 0-based line numbers.

<a name=TraceBackward></a>
```json
["TraceBackward",{"win":123}] // RIDE -> Interpreter
```
Request the current line in a trace window be moved back.

<a name=ClearTraceStopMonitor></a>
```json
["ClearTraceStopMonitor",{"token":123}] // RIDE -> Interpreter
["ReplyClearTraceStopMonitor",{"traces":0,"stops":0,"monitors":0,"token":123}] // Interpreter -> RIDE
```
Request it clears all traces, stops, and monitors in the active workspace. The reply says how many of each thing were cleared.

<a name=Continue></a>
```json
["Continue",{"win":123}] // RIDE -> Interpreter
```
Request resume execution of the current thread.

<a name=ContinueTrace></a>
```json
["ContinueTrace",{"win":123}] // RIDE -> Interpreter
```
Request resume execution of the current function, but stop on the next line of the calling function.

<a name=Cutback></a>
```json
["Cutback",{"win":123}] // RIDE -> Interpreter
```
Request the stack is cut back one level.  This is equivalent to returning to the caller without executing the rest of
the current function.

<a name=TraceForward></a>
```json
["TraceForward",{"win":123}] // RIDE -> Interpreter
```
Request the current line in a trace window be moved forward.

<a name=RestartThreads></a>
```json
["RestartThreads",{}] // RIDE -> Interpreter
```
Request resume execution of all threads.

<a name=RunCurrentLine></a>
```json
["RunCurrentLine",{"win":123}] // RIDE -> Interpreter
```
Request the current line in a trace window is executed. (Step over)

<a name=StepInto></a>
```json
["StepInto",{"win":123}] // RIDE -> Interpreter
```
Request the current line in a trace window is executed. (Step into)

<a name=GetSIStack></a>
<a name=ReplyGetSIStack></a>
```json
["GetSIStack",{}] // RIDE -> Interpreter
["ReplyGetSIStack",{"stack":[{"description":"#.f[12]*"},{"description":"#.g[34]"}],"tid":2}] // Interpreter -> RIDE
```

Request information about the current stack.

Get information about the current threads.
<a name=GetThreads></a>
```json
["GetThreads",{}] // RIDE -> Interpreter
```
The interpreter will respond with ReplyGetThreads:
```json
["ReplyGetThreads",{"threads":[
    {"description":"","state":"Session","tid":0,"flags":"Normal","Treq":""},
    ]}]// Interpreter -> RIDE
```
* `description`: a text description of the thread. Derived from the Tid and ⎕TNAME for the thread
* `state`: a string indicating the current location of the thread
* `tid`: the Tid (numeric)
* `flags`: e.g. Normal, Paused or Terminated
* `Treq`: a string indicating any tokens that the thread is waiting for.




# Interrupts
APL supports two kinds of interrupts
<a name=WeakInterrupt></a><a name=StrongInterrupt></a>
```json
["WeakInterrupt",  {}] // RIDE -> Interpreter
["StrongInterrupt",{}] // RIDE -> Interpreter
```
The interpreter message queue should check for strong interrupts and handle them immediately without needing to fully
parse messages.

:red_circle: I've no idea what the above sentence means -Nick

# Autocompletion
RIDE can request autocompletion with
<a name=GetAutocomplete></a>
```json
["GetAutocomplete",{"line":"r←1+ab","pos":6,"token":234}] // RIDE -> Interpreter
```
* `line`: text containing the name that's being completed
* `pos`: position of cursor within `line`
* `token` is used by [`ReplyGetAutocomplete`](#ReplyGetAutocomplete) to identify which request it is a response to. RIDE
may send multiple `GetAutocomplete` requests and the interpreter may only reply to some of them. Similarly, RIDE may
ignore some of the replies if the state of the editor has changed since the `GetAutocomplete` request was sent.
In order to remain responsive, RIDE should throttle its autocompletion requests (no more than N per second) and it
shouldn't block while it's waiting for the response.

:red_circle: The interpreter requires that "token" is the id of the window, so perhaps it should be renamed "win".

:red_circle: If RIDE sends a different token, the interpreter doesn't respond.

<a name=ReplyGetAutocomplete></a>
```json
["ReplyGetAutocomplete",{"skip":2,"options":["ab","abc","abde"],"token":234}] // Interpreter -> RIDE
```
* `skip`: how many characters before the request's `pos` to replace with an element of `options`

# Value tips
When the user hovers a name with the mouse, RIDE should ask for a short textual representation of the current value:
<a name=GetValueTip></a><a name=ValueTip></a>
```json
["GetValueTip",{"win":123,"line":"a←b+c","pos":2,"maxWidth":50,"maxHeight":20,"token":456}] // RIDE -> Interpreter
["ValueTip",{"tip":["0 1 2","3 4 5"],"class":2,"startCol":2,"endCol":3,"token":456}] // Interpreter -> RIDE
```
Like with autocompletion, `token` is used to correlate requests and responses, and there is no guarantee that they will
arrive in the same order, if ever.

`maxHeight` and `maxWidth` can be used to limit the number of lines and columns in the result.

In the response, `class` indicates the
[nameclass](http://help.dyalog.com/16.0/Content/Language/System%20Functions/nc.htm) of the object.
This information can be used to syntax-highlight the tooltip.

`startCol` and `endCol` describe the position of the whole name to which the value tip pertains.
`startCol` is inclusive and `endCol` is exclusive.

# Dialogs
The interpreter can ask RIDE to interact with the user by showing a modal dialog.
Several kinds of dialogs are supported:

## Options dialog
<a name=OptionsDialog></a><a name=ReplyOptionsDialog></a>
```json
["OptionsDialog",{"title":"","text":"","type":1,"options":["Yes","No","Cancel"],"token":123}] // Interpreter -> RIDE
["ReplyOptionsDialog",{"index":0,"token":123}] // RIDE -> Interpreter
```
Constants for type: `1` warning, `2` information, `3` question, `4` stop.

If the user closes the dialog without choosing an option, RIDE responds with an `index` of `-1`.

## String dialog
<a name=StringDialog></a><a name=ReplyStringDialog></a>
```json
["StringDialog",{"title":"Name","text":"Please enter a name:","initialValue":"abc","defaultValue":null,"token":123}] // Interpreter -> RIDE
["ReplyStringDialog",{"value":"abcd","token":123}] // RIDE -> Interpreter
```

## Task dialog
A "task dialog" shows two sets of buttons -- vertically aligned `buttonText` and below them the horizontally aligned
`options`.
```json
["TaskDialog",{"title":"Save document","text":"Save document options",
               "subtext":"Do you want to save the changes to the document?",
               "buttonText":["Save in XML base format","Save in binary format"],
               "options":["No","Cancel"],
               "footer":"Note: If you don't choose to save, your changes will be lost"}] // Interpreter -> RIDE
["ReplyTaskDialog",{"index":"101","token":123}] // RIDE -> Interpreter
```
In the response `index` can be:
* `100+i` where `i` is the index of a `buttonText` button
* the index of an `options` button
* `-1` if the user closes the dialog

## Notification
<a name=NotificationMessage></a>
```json
["NotificationMessage",{"message":"Object too large to edit","token":123}] // Interpreter -> RIDE
```

# Other
<a name=ShowHTML></a>
```json
["ShowHTML",{"title":"Example","html":"<i>Hello</i> <b>world</b>"}] // Interpreter -> RIDE
```
Request RIDE shows some HTML.
See
[`3500⌶`](http://help.dyalog.com/16.0/Content/Language/Primitive%20Operators/Send%20Text%20to%20RIDE-embedded%20Browser.htm).

<a name=UpdateDisplayName></a>
```json
["UpdateDisplayName",{"displayName":"CLEAR WS"}] // Interpreter -> RIDE
```
RIDE can use the display name as the title of its application window.

<a name=Disconnect></a>
```json
["Disconnect",{"message":"..."}]
```
Sent from any peer to shut down the connection cleanly.

:red_circle: Why do we need "Disconnect"?  Why not just close the TCP connection?  That shouldn't be any less "clean".

# Workspace explorer
Optionally, RIDE can display a tree representing session content.
It can query information about the children of a particular node with
<a name=TreeList></a>
<a name=ReplyTreeList></a>
```json
["TreeList",{"nodeId":12}] // RIDE -> Interpreter
["ReplyTreeList",{"nodeId":12,"nodeIds":[34,0],"names":["ab","cde"],
                  "classes":[9.4,3.2],"err":""}] // Interpreter -> RIDE
```
The root of the tree is assumed to have a node id of 0.
* `nodeId` is the requested parent id.
* `nodeIds` are the ids of the children; some of them can be 0 -- those children can't themselves have children.
* `classes` are [name classes](http://help.dyalog.com/16.0/Content/Language/System%20Functions/nc.htm#NameClassification)
  that can be used to choose appropriate styling
* `err` is non-empty only when an error has occurred in the interpreter, e.g. when `nodeId` is no longer invalid

RIDE should query information only about the visible parts of the tree as they get expanded.

When the user presses Enter or clicks on an editable node, RIDE should use the [Edit](#Edit) command to notify the
interpreter.  Then it can send back commands to open or focus an editor window.

# Status window

The interpreter may request the display of messages in a separate "Status Output" window.

<a name=ConnectTo></a>
```json
["StatusOutput",{"text":"some very important message\r\n","flags":2}] // Interpreter -> RIDE
```

`flags` (despite its name) is the message type, one of:
* `1` info, usually shown in green
* `2` error, red
* `4` warning, blue
* `8` .Net function overload clash overload (red?)

# Process manager
:red_circle: As of April 2016 there is no process manager.

<a name=GetAvailableConnections></a>
```json
["GetAvailableConnections",{"connections":[c0,c1,...]}] // RIDE or Interpreter -> PM
```
:red_circle: Specify what c0,c1,... look like

<a name=ConnectTo></a>
```json
["ConnectTo",{"remoteId":123}] // RIDE or Interpreter -> PM
```
Request a connection to a specific item (RIDE or interpreter).

<a name=ConnectToSucceded></a>
```json
["ConnectToSucceded",{"remoteId":123,"identity":1,"protocolNumber":...}] // PM -> RIDE or Interpreter
```
Tell the client that the ProcessManager is handing off the connection to a RIDE or Interpreter (as requested).
The process manager knows the supported protocols so it can pick a supported protocol for the clients to switch to.
Once this is received the client is no longer connected to the PM, but rather is connected to the specified process.

`identity`: see [Identify](#Identify)

<a name=ConnectToFailed></a>
```json
["ConnectToFailed",{"remoteId":123,"reason":""}] // PM -> RIDE or Interpreter
```
Tell the client that the attempt to connect to a particular process failed.

<a name=GetDetailedInformation></a>
```json
["GetDetailedInformation",{"remoteId":[12,34,...]}] // anything -> anything
```
If sent to a Process manager, `remoteId` is a list of remote IDs returned by
[`GetAvailableConnections`](#GetAvailableConnections). Otherwise it's an empty list.

<a name=ReplyGetDetailedInformation></a>
```json
["ReplyGetDetailedInformation",{"information":[i0,i1,...]}] // anything -> anything
```

# Proposed extensions
* related to the process manager
```
AvailableConnection => [
    int remoteID,       // Unique ID
    string displayName  // Display name for the entry.
]
DetailedInformation => [
  int remoteID,    // Unique ID if sent from a Process Manager, otherwise 0
  identity identity,
  (DetailedRideInformation|DetailedInterpreterInformation|DetailedProcessInformation) Information
]
DetailedRideInformation => [] // Placeholder - add any more information
DetailedInterpreterInformation => [] // Placeholder - add any more information
DetailedProcessManagerInformation => [] // Placeholder - add any more information
```
* `⎕PFKEY`
* programmatic access to "current object"
```json
["SetCurrentObject",{"text":""}] // RIDE -> Interpreter
```
* compiler information
* list of valid I-beams and their descriptions
* `ShowStack` and `ShowThreads`
* drop workspace in RIDE
* heartbeat
