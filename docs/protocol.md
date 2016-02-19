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
The payload is usually a 2-element JSON array consisting of a command name and arguments as key/value pairs:
```json
["CommandName",{"key1":"value1","key2":222,"key3":[3,4,5]}]
```
The only exception are the first two messages that each side sends upon establishing a connection.
These constitute the *handshake* and are not JSON-encoded.  Their payloads are:
```
SupportedProtocols=1
UsingProtocol=1
```

Messages are independent and after the handshake can be sent/received in any order. Some messages infer that the other
end will send a reply, but that reply may not be the next message to be received, or even ever be sent.

If the receiver of a message does not recognise it, it should not take any action apart from optionally responding with
```json
["UnknownCommand",{"name":"Xyz"}]
```

The connection may be closed at any time, leaving some messages undelivered or unprocessed.

Command names and their arguments are case-sensitive.

JSON booleans `true` and `false` can be freely substituted with and should be treated as equivalent to `1` and `0`.

#Connection setup and teardown

After the connection has been established and a protocol agreed, both peers immediately send an `Identify` message to
indicate what type of application they are.

<a name=Identify></a>
```json
["Identify",{"identity":1}]
```
Constants for `identity`: `1` RIDE, `2` interpreter, `3` process manager.

:red_circle: The interpreter sends an `Identify` that means something else and has different args.

They should then check the type of application they are connected to, and if not happy to continue, close the
connection.  For instance, RIDE may check that the application it's connected to is an interpreter or a process
manager. If it finds the peer is another RIDE, it should close the connection.

:red_circle: In reality RIDE doesn't bother verifying that it's not talking to another RIDE.

If at any time the interpreter crashes with a
[syserror](http://help.dyalog.com/14.1/Content/UserGuide/Installation%20and%20Configuration/System%20Errors.htm), it
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

#Session control
Any echoed input or interpreter output or the initial content of the session are sent to RIDE using
<a name=AppendSessionOutput></a><a name=EchoInput></a>
```json
["EchoInput",{"input":"      1 2 3+4 5 6\n"}] // Interpreter -> RIDE
["AppendSessionOutput",{"result":["5 7 9"]}]  // Interpreter -> RIDE
```
These two perform essentially the same task except that `AppendSessionOutput` needs extra `"\n"`-s to be appended to
each element of `result`.

The interpreter informs RIDE about changes in its ability to accept user input with
<a name=SetPromptType></a>
```json
["SetPromptType",{"type":5}] // Interpreter -> RIDE
```
Constants for `type`: `0` no prompt, `1` the usual 6-space APL prompt (a.k.a. Descalc or "desktop calculator"), `2`
[Quad(`⎕`)](http://help.dyalog.com/14.1/Content/Language/System%20Functions/Evaluated%20Input%20Output.htm) input, `3`
line editor, `4`
[Quote-Quad(`⍞`)](http://help.dyalog.com/14.1/Content/Language/System%20Functions/Character%20Input%20Output.htm) input,
`5` any prompt type unforeseen here.

:red_circle: These modes need explaining with expected behaviour.

In addition to passively processing `SetPromptType` messages, RIDE can request information about the interpreter's
ability to accept input at any time through
<a name=CanSessionAcceptInput></a><a name=ReplyCanSessionAcceptInput></a>
```json
["CanSessionAcceptInput",{}]                           // RIDE -> Interpreter
["ReplyCanSessionAcceptInput",{"canAcceptInput":true}] // Interpreter -> RIDE
```

:red_circle: RIDE2+ doesn't use these.

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
RIDE should clear its queue of pending lines on `HadError`.

RIDE can optionally advise the interpreter about the session's width in characters with
<a name=SetPW></a>
```json
["SetPW",{"pw":79}] // RIDE -> Interpreter
```
Further output will wrap at that width (with a few exceptions).
See [`⎕PW`](http://help.dyalog.com/14.1/Content/Language/System%20Functions/pw.htm).

#Window management
When the user presses `<ED>` (Shift-Enter), RIDE should send
<a name=Edit></a>
```json
["Edit",{"win":123,"text":"a←b+c×d","pos":4}] // RIDE -> Interpreter
```
to request opening an editor.  `pos` is the 0-based position of the cursor in `text`.
The interpreter will parse that and may respond later with one of
<a name=OpenWindow></a><a name=UpdateWindow></a>
```json
["OpenWindow",{"name":"f","text":["r←f a","r←(+⌿÷≢)a"],"token":123,"currentRow":0,"debugger":false,
               "entityType":1,"offset":0,"readOnly":false,"size":0,"stop":[1],
               "tid":0,"tname":"Tid:0"}] // Interpreter -> RIDE
["UpdateWindow",...] // Interpreter -> RIDE (same args as OpenWindow)
```
It may also send these in response to [`)ed
name`](http://help.dyalog.com/14.1/Content/Language/System%20Commands/ed.htm) or
[`⎕ed'name'`](http://help.dyalog.com/14.1/Content/Language/System%20Functions/ed.htm), as well as when tracing into an
object that is not
currently being traced.

Constants for `entityType`: `1` defined function, `2` simple character array, `4` simple numeric array, `8` mixed simple
array, `16` nested array, `32` [`⎕OR`](http://help.dyalog.com/14.1/Content/Language/System%20Functions/or.htm) object,
`64` native file, `128` simple character vector, `256` APL namespace, `512` APL class, `1024` APL interface, `2048` APL
session, `4096` external function.

:red_circle: TODO: describe the other arguments

RIDE should let the OS do its own focus management of editor/tracer windows except that when it receives
<a name=FocusWindow></a>
```json
["FocusWindow",{"win":123}] // Interpreter -> RIDE
```
it should set the focus accordingly.

The interpreter may decide to change the type of a window (editor vs tracer) with
<a name=WindowTypeChanged></a>
```json
["WindowTypeChanged",{"win":123,"tracer":true}] // Interpreter -> RIDE
```

When the user presses `<EP>` (Esc), RIDE should request that the editor contents are fixed through
<a name=SaveChanges></a>
```json
["SaveChanges",{"win":123,"text":"r←avg a\ns←+⌿a\nn←≢a\nr←s÷n","stop":[2,3]}] // RIDE -> Interpreter
```
`stop` is an array of 0-based line numbers.

The interpreter responds with
<a name=ReplySaveChanges></a>
```json
["ReplySaveChanges",{"win":123,"err":0}] // Interpreter -> RIDE
```
If `err` is 0, save succeeded; otherwise it failed.

When the user presses `<EP>` (Esc) and saving is successful or presses `<QT>` (Shift-Esc), RIDE sends
<a name=CloseWindow></a>
```json
["CloseWindow",{"win":123}] // RIDE -> Interpreter  and  Interpreter -> RIDE
```
but does not close the UI window until the interpreter replies with the same message.

#Debugging
The following messages are used in relation to trace windows.
<a name=HighlightLine></a>
```json
["HighlightLine",{"win":123,"line":45}] // Interpreter -> RIDE
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
["ClearTraceStopMonitor",{"win":123}] // RIDE -> Interpreter
```
Request it clears all breakpoints, stops, and monitors for a trace window.

:red_circle: Not used in RIDE2+

<a name=Continue></a>
```json
["Continue",{"win":123}] // RIDE -> Interpreter
```
Request restart of the APL program. (Black arrow in ODE)

:red_circle: "Continue" to restart? -- that doesn't sounds right...

<a name=ContinueTrace></a>
```json
["ContinueTrace",{"win":123}] // RIDE -> Interpreter
```
Request resumption of tracing an APL program. (White arrow in ODE)

<a name=ContinueAllThreads></a>
```json
["ContinueAllThreads",{"win":123}] // RIDE -> Interpreter
```
:red_circle: Not used in RIDE2+.  The green arrow actually corresponds to [`RestartThreads`](#RestartThreads).

Request resumption of all threads. (Green arrow in ODE)

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
["RestartThreads",{"win":123}] // RIDE -> Interpreter
```
Request all suspended threads are restarted.

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

<a name=UnpauseThreads></a>
```json
["UnpauseThreads",{"win":123}] // RIDE -> Interpreter
```
:red_circle: Not used in RIDE2+

Request all suspended threads are resumed from their current position.

#Interrupts
APL supports two kinds of interrupts
<a name=WeakInterrupt></a><a name=StrongInterrupt></a>
```json
["WeakInterrupt",  {}] // RIDE -> Interpreter
["StrongInterrupt",{}] // RIDE -> Interpreter
```
The interpreter message queue should check for strong interrupts and handle them immediately without needing to fully
parse messages.

:red_circle: I've no idea what the above sentence means -Nick

#Autocompletion
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

#Value tips
When the user hovers a name with the mouse, RIDE should ask for a short textual representation of the current value:
<a name=GetValueTip></a><a name=ValueTip></a>
```json
["GetValueTip",{"win":123,"line":"a←b+c","pos":2,
                "maxWidth":50,"maxHeight":20,"token":456}] // RIDE -> Interpreter
["ValueTip",{"tip":["0 1 2","3 4 5"],"class":1,"token":456}] // Interpreter -> RIDE
```
Like with autocompletion, `token` is used to correlate requests and responses, and there is no guarantee that they will
arrive in the same order, if ever.

`maxHeight` and `maxWidth` can be used to limit the number of lines and columns in the result.

In the response, `class` indicates the
[nameclass](http://help.dyalog.com/14.1/Content/Language/System%20Functions/nc.htm) of the object.
This information can be used to syntax-highlight the tooltip.

#Dialogs
The interpreter can ask RIDE to interact with the user by showing a modal dialog.
Two types of dialogs are supported:

##Multiple choice
<a name=ShowDialog></a><a name=DialogResult></a>
```json
["ShowDialog",{"title":"","text":"","type":1,"options":["Yes","No","Cancel"],"token":123}] // Interpreter -> RIDE
["DialogResult",{"index":0,"token":123}] // RIDE -> Interpreter
```
Constants for type: `1` info, `2` warning, `3` error.

If the user closes the dialog without choosing an option, RIDE responds with an `index` of `-1`.

:red_circle: "type" is not supported

:red_circle: Rename this to `ShowMultipleChoiceDialog`/`MultipleChoiceDialogResult` for symmetry with `StringInput`?

##String input
<a name=ShowStringInputDialog></a><a name=StringInputDialogResult></a>
```json
["ShowStringInputDialog",{"title":"Name","text":"Please enter a name:","initialValue":"abc","defaultValue":null,"token":123}] // Interpreter -> RIDE
["StringInputDialogResult",{"value":"abcd","token":123}] // RIDE -> Interpreter
```

#Other
<a name=ShowHTML></a>
```json
["ShowHTML",{"title":"Example","html":"<i>Hello</i> <b>world</b>"}] // Interpreter -> RIDE
```
Request RIDE shows some HTML.
See
[`3500⌶`](http://help.dyalog.com/14.1/Content/Language/Primitive%20Operators/Send%20Text%20to%20RIDE-embedded%20Browser.htm).

<a name=StatusOutput></a>
```json
["StatusOutput",{"text":"Bla-blah","flags":4}] // Interpreter -> RIDE
```
Constants for `flags`: `1` information message, `2` error message, `4` warning message

:red_circle: RIDE3 doesn't support `flags`.

Status information that should be displayed to the user.

<a name=UpdateDisplayName></a>
```json
["UpdateDisplayName",{"displayName":"CLEAR WS"}] // Interpreter -> RIDE
```
RIDE can use the display name as the title of its application window.

<a name=Disconnect></a>
```json
["Disconnect",{"msg":"..."}]
```
Sent from any peer to shut down the connection cleanly.

:red_circle: This is pointless -Nick

#Workspace explorer
Optionally, RIDE can display a tree representation of the objects in the current session.
It can query the interpreter for this information in a uniform way for all types of nodes:
<a name=TreeList></a>
```json
["TreeList",{"nodeId":123}] // RIDE -> Interpreter
["ReplyTreeList",{"nodeId":123,"children":[{"id":234,"type":1,"name":"Abc"},...]}] // Interpreter -> RIDE
```
The root of the tree is assumed to have node id 0.
`type` is a hint about the icon and style for the node.

RIDE should query information only about the visible parts of the tree as they get expanded.

When the user presses Enter or clicks on a node, RIDE should send
<a name=TreeAction></a>
```json
["TreeAction",{"nodeId":123}] // RIDE -> Interpreter
```
The interpreter should ignore silently any invalid and outdated node ids.

#Process manager
:red_circle: As of Feb 2016 there is no process manager.

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

#Proposed extensions
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
["SetCurrentObject",{text:""}] // RIDE -> Interpreter
```
* compiler information
* list of valid I-beams and their descriptions
* `ShowStack` and `ShowThreads`
* drop workspace in RIDE
* heartbeat
