> Note: :x: :exclamation: :question: mark internal notes and won't appear in the final version -Nick

The RIDE protocol is formed of messages sent in either direction over a TCP connection.

A message starts with a 4-byte big-endian *total length* field, followed by the ASCII bytes for `"RIDE"` and a UTF-8-encoded payload:
```
    8+len(payload)   "RIDE" magic number   payload
┌───────────────────┬───────────────────┬───────────┐
│0x00 0x00 0x00 0x0b│0x52 0x49 0x44 0x45│    ...    │
└───────────────────┴───────────────────┴───────────┘
```
*Total length* is 8 + the payload's length in bytes.
The payload is usually a 2-element JSON array consisting of a command name and arguments as key/value pairs:
```json
["CommandName",{"key1":value1,"key2":value2,...}]
```
The only exception are the first two messages that each side sends upon establishing a connection.
These constitute the *handshake* and are not JSON-encoded.  Their payloads are:
```
SupportedProtocols=1
UsingProtocol=1
```

Messages are independent and after the handshake can be sent/received in any order. Some messages infer that the other end will send a reply, but that reply may not be the next message to be received, or even ever be sent.

Command names and their arguments are case-sensitive.

:exclamation: was: case-insensitive

If the receiver of a message does not recognise it, it should ignore it.

The connection may be closed at any time, leaving some messages undelivered or unprocessed.

:question: Why say the above?  Isn't it obvious?

#Initial connection setup

After the connection has been established and a protocol agreed, all applications immediately send an [`Identify`](#Identify) message to indicate what type of application they are.
They should then check the type of application they are connected to, and if not happy to continue, close the connection.

E.g. a RIDE should send an [`Identify`](#Identify) message and then check that the application it's connected to is an interpreter or a process manager. If it finds the peer is another RIDE, it should close the connection.

#Message set

##Sent from RIDE to interpreters

<a name=CanSessionAcceptInput></a>
```json
["CanSessionAcceptInput",{}]
```
:x: Not used in RIDE2+. This information is already available through [`AtInputPrompt`](#AtInputPrompt).

Establish if the session can accept input.

<a name=TraceBackward></a>
```json
["TraceBackward",{"win":123}]
```
Request the current line in a trace window be moved back.

<a name=ClearTraceStopMonitor></a>
```json
["ClearTraceStopMonitor",{"win":123}]
```
:x: Not used in RIDE2+

Request it clears all breakpoints, stops, and monitors for a trace window.

<a name=Continue></a>
```json
["Continue",{"win":123}]
```
Request restart of the APL program. (Black arrow in ODE)

<a name=ContinueTrace></a>
```json
["ContinueTrace",{"win":123}]
```
Request resumption of tracing an APL program. (White arrow in ODE)

<a name=ContinueAllThreads></a>
```json
["ContinueAllThreads",{"win":123}]
```
:x: Not used in RIDE2+.  The green arrow actually corresponds to [`RestartThreads`](#RestartThreads).

Request resumption of all threads. (Green arrow in ODE)

<a name=Cutback></a>
```json
["Cutback",{"win":123}]
```
Request the stack is cut back one level.

<a name=TraceForward></a>
```json
["TraceForward",{"win":123}]
```
Request the current line in a trace window be moved forward.

<a name=RestartThreads></a>
```json
["RestartThreads",{"win":123}]
```
Request all suspended threads are restarted.

<a name=RunCurrentLine></a>
```json
["RunCurrentLine",{"win":123}]
```
Request the current line in a trace window is executed. (Step over)

<a name=StepInto></a>
```json
["StepInto",{"win":123}]
```
Request the current line in a trace window is executed. (Step into)

<a name=UnpauseThreads></a>
```json
["UnpauseThreads",{"win":123}]
```
:x: Not used in RIDE2+

Request all suspended threads are resumed from their current position.

<a name=Edit></a>
```json
["Edit",{"win":123,"pos":4,"text":"a←b+c×d"}]
```
Request opening an editor on the term at the given position in edit.

<a name=Execute></a>
```json
["Execute",{"text":"      1 2 3+4 5 6","trace":true}]
```
* `text`: to evaluate
* `trace`: the expression should be evaluated in the tracer

<a name=GetAutoComplete></a>
```json
["GetAutoComplete",{"line":"r←1+ind","pos":7,"token":234}]
```
The `token` is used by [`ReplyGetAutoComplete`](#ReplyGetAutoComplete) to identify which request it is a response to. RIDE may send multiple `GetAutoComplete` requests and the interpreter may only reply to some of them. Similarly, RIDE may ignore some of the replies if the state of the editor has changed since the `GetAutoComplete` request was sent.

* `line`: text containing term to get autocomplete data for
* `pos`: position in the line to use for autocomplete information

:exclamation: The interpreter requires that "token" is the id of the window, so perhaps it should be renamed "win".

:exclamation: If RIDE sends a different token, the interpreter doesn't respond.

:exclamation: I think the C in AutoComplete shouldn't be capitalised as "autocomplete" is one word

<a name=SaveChanges></a>
```json
["SaveChanges",{"win":123,"text":"r←avg a\nr←(+⌿÷≢)a","lineAttributes":...}]
```
Request that the contents of an editor are fixed.

<a name=WeakInterrupt></a>
```json
["WeakInterrupt",{}]
```
Request a weak interrupt.

<a name=GetLanguageBar></a>
```json
["GetLanguageBar",{}]
```
:x: Not used in RIDE2+.  Information about the language bar is known in advance, there's no need to send it through the protocol.

Request that the interpreter sends a language bar.

<a name=GetSessionContent></a>
```json
["GetSessionContent",{}]
```
:x: Not used in RIDE2+. The interpreter side sends the session content automatically on connection.

Request the current content of the session.

<a name=UpdateAllWindows></a>
```json
["UpdateAllWindows",{}]
```
:x: Not used in RIDE2+

Request the interpreter sends [`UpdateWindow`](#UpdateWindow) messages for all currently open windows.

<a name=StrongInterrupt></a>
```json
["StrongInterrupt",{}]
```
The interpreter message queue should check for strong interrupts and handle them immediately without needing to fully parse messages.

<a name=Exit></a>
```json
["Exit",{"code":0}]
```
Request that the interpreter process exits. This is useful for cleanly shutting down a locally spawned interpreter.

##Sent from the interpreter to RIDE
<a name=AtInputPrompt></a>
```json
["AtInputPrompt",{"inputModeState":5}]
```
Inform RIDE that session input should be allowed, and the reason why. RIDE uses this information to determine when to display the six space prompt.
TODO: describe constants for "why"

<a name=ReplyCanSessionAcceptInput></a>
```json
["ReplyCanSessionAcceptInput",{"canAcceptInput":true}]
```
Inform RIDE whether or not the session can currently accept input.

:x: Note: This is a hack and should go away...

<a name=EchoInput></a>
```json
["EchoInput",{"input":"      1 2 3+4 5 6\n"}]
```
Note that RIDE will append a newline before displaying the input.
Note: RIDE can’t assume that everything entered in the session should be echoed. e.g. quote quad input.

<a name=OpenWindow></a>
```json
["OpenWindow",{"editableEntity":...}]
```
Request a new editor or tracer window.

<a name=AppendSessionOutput></a>
```json
["AppendSessionOutput",{"result":["5 7 9"]}]
```
Display text in the session.
Should be used for initial display of the session log, as well as other output.
`result` is an array of strings -- lines without `"\n"`-s.

<a name=FocusWindow></a>
```json
["FocusWindow",{"win":123}]
```
Request that RIDE puts the focus into a particular window.

<a name=ReplyGetAutoComplete></a>
```json
["ReplyGetAutoComplete",{"skip":2,"options":["ab","abc","abde"],"token":123}]
```
:exclamation: RIDE2+ supports this command in a slightly different format, legacy from before I switched to RIDE protocol v2.

Sent in response to a [`GetAutoComplete`](#GetAutoComplete) message.

<a name=LanguageBar></a>
```json
["LanguageBar",{"elements":[languageBarElement0,...]}]
```
:x: not used in RIDE2+
Sent if the language bar is requested or updated.

<a name=HadError></a>
```json
["HadError",{}]
```
Sent if evaluating an expression generates an error. If RIDE has any pending expressions to evaluate it should discard them.

<a name=HighlightLine></a>
```json
["HighlightLine",{"lineInfo":...}]
```
:exclamation: RIDE2+ supports this command in a slightly different format, legacy from before I switched to RIDE protocol v2.

Request that RIDE sets the position of the current line marker in a trace window.

<a name=NotAtInputPrompt></a>
```json
["NotAtInputPrompt",{}]
```
Tell RIDE to disable session input.

<a name=ReplySaveChanges></a>
```json
["ReplySaveChanges",{"win":123,"err":0}]
```
Sent in response to a [`SaveChanges`](#SaveChanges) message.
If `err` is 0, save succeeded; otherwise it failed.

<a name=ShowHTML></a>
```json
["ShowHTML",{"title":"Example","html":"<i>Hell</i><b>o</b> world"}]
```
Request RIDE shows some HTML.  See `3500⌶`.

<a name=StatusOutput></a>
```json
["StatusOutput",{"statusInfo":"Bla-blah"}]
```
:exclamation: Not supported in RIDE but likely will be in the future.

Status information that should be displayed to the user.

<a name=SysError></a>
```json
["SysError",{"text":"We accidentally replaced your heart with a baked potato","stack":"..."}]
```
Sent after a syserror before the interpreter terminates.

<a name=UpdateWindow></a>
```json
["UpdateWindow",{"editableEntity":...}]
```
Tell RIDE to update the contents of a window. Typically used when a window switches from tracer mode to editor mode, or tracing up/down the stack.

<a name=UpdateDisplayName></a>
```json
["UpdateDisplayName",{"displayName":"CLEAR WS"}]
```
Sent when the display name changes.

<a name=WindowTypeChanged></a>
```json
["WindowTypeChanged",{"win":123,"tracer":true}]
```
Tell RIDE to switch a window between debugger and editor modes.

#Sent from either RIDE or interpreter
<a name=SetLineAttributes></a>
```json
["SetLineAttributes",{"win":123,"lineAttributes":...}]
```
Update the breakpoints, Trace points and monitors in an editor.

<a name=CloseWindow></a>
```json
["CloseWindow",{"win":123}]
```
If sent from the interpreter, tell RIDE to close an open editor window.
If sent from RIDE, request that a window be closed.

#Sent from either a RIDE, Interpreter or Process Manager
<a name=Identify></a>
```json
["Identify",{"identity":1}]
```
Sent as part of the initial connection setup.

<a name=Disconnect></a>
```json
["Disconnect",{"msg":"..."}]
```
Sent to shut down the connection cleanly.

#Sent from a RIDE or Interpreter to a Process Manager
<a name=GetAvailableConnections></a>
```json
["GetAvailableConnections",{"connections":[c0,c1,...]}]
```
Request a list of availabe connections.

<a name=ConnectTo></a>
```json
["ConnectTo",{"remoteId":123}]
```
Request a connection to a specific item (RIDE or interpreter).

#Sent from a Process manager to a RIDE or Interpreter
<a name=ConnectToSucceded></a>
```json
["ConnectToSucceded",{"remoteId":123,"identity":1,"protocolNumber":...}]
```
Tell the client that the ProcessManager is handing off the connection to a RIDE or Interpreter (as requested).
The process manager knows the supported protocols so it can pick a supported protocol for the clients to switch to.
Once this is received the client is no longer connected to the PM, but rather is connected to the specified process.

<a name=ConnectToFailed></a>
```json
ConnectToFailed [int remoteId, string reason]
  Tell the client that the attempt to connect to a particular process failed.
```

#Sent from anything to anything
<a name=GetDetailedInformation></a>
```json
["GetDetailedInformation",{"remoteId":[12,34,...]}]
```
If sent to a Process manager, `remoteId` is a list of remote IDs returned by [`GetAvailableConnections`](#GetAvailableConnections). Otherwise it's an empty list.

<a name=ReplyGetDetailedInformation></a>
```json
["ReplyGetDetailedInformation",{"information":[i0,i1,...]}]
```
Sent in reply to [`GetDetailedInformation`](#GetDetailedInformation).

#Extended types
This section describes types used in the messages that extend the simple types used in the message encoding.

Note: Check if these are only used in one place. If so flatten out to properties of the message its used in

Note: If an enumeration is sent with any undefined value it is considered invalid.

```
Bool => enumeration [0 false, 1 true]
Identity => enumeration [0 invalid, 1 RIDE, 2 Interpreter, 3 PM]
InputModeState => [0 Invalid, 1	Descalc,
                   2 QuadInput, 3 LineEditor,
                   4 QuoteQuadInput, 5 Prompt]  // These modes need explaining with expected behaviour

EditableEntity => [string name, string text, int token,
                   byte[] colours, int currentRow, int currentColumn,    //REVIEW
                   int subOffset, int subSize, bool debugger,
                   int tid, bool readonly, string tidName,
                   entityType type, lineAttributes attributes]  // colours for syntax highlighting - probably shouldn't be here?
                                                                //   NN: RIDE2+ ignores colours, subOffset, subSize, tid, and tidName

lineAttributes => lineAttribute[int[] stop, int[] monitor, int[] trace] // vector of lines with the given attribute. If a line is not mentioned it
                                                                        // has no attributes
                                                                        //   NN: RIDE2+ uses only "stop"

EntityType => enumeration [0 invalid,
                           1 definedFunction,
                           2 simpleCharArray,
                           3 simpleNumericArray,
                           4 mixedSimpleArray,
                           5 nestedArray,
                           6 QuadORObject,
                           7 NativeFile,
                           8 SimpleCharVector,
                           9 AplNamespace,
                           10 AplClass,
                           11 AplInterface,
                           12 AplSession,
                           13 ExternalFunction]

LanguageBarElement => [string desc, character chr, string text]

LineInfo => [int win, int line]

StatusInfo => [string text, int flags]

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

#Extensions
NN: We should add support for:
* value tips.  Needs design with JD -- window content might have changed, the name might be context-dependent
```
    RIDE→Interpreter:  GetValueTip [int win, string line, int pos, int token]
    Interpreter→RIDE:  ValueTip [string tip, int token]
```
* `⎕PFKEY`
* `⎕PW` and `AUTO_PW`
```
    RIDE→Interpreter:  SetPW [int pw]
```
* programmatic access to "current object"
```
    RIDE→Interpreter:  SetCurrentObject [string s]
```
* workspace explorer
```
    NB. use ids (of type "Something") instead of string[] path
    RIDE→Interpreter:  TreeGetNameList [Something nodeId]
    Interpreter→RIDE:  TreeNameList [Something nodeId, NodeInfo[] children]
                            NodeInfo [
                                Something id
                                int type
                                string name
                            ]
    Interpreter→RIDE:  TreeOpenEditor [Something nodeId]
```
* compiler information
* yes/no dialogs
```
    Interpreter→RIDE:  ShowDialog [string title, string text, int type, string[] options, int token]
                            type: one of 1=info 2=warning 3=err ...
    RIDE→Interpreter:  DialogResult [int index, int token]

    2015-12-15 NN: This is now supported except that "type" is ignored.
      When the user closes the dialog without choosing an option, RIDE responds with index:-1
```
* list of valid I-beams and their descriptions
* `ShowStack` and `ShowThreads`
* drop workspace in RIDE
* heartbeat
