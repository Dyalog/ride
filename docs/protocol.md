# The Ride Protocol

## Introduction 

> Note: A red circle :red_circle: marks internal notes which won't appear in the final version.

The Ride protocol is formed of messages sent in either direction over a TCP connection.

A message starts with a 4-byte big-endian *total length* field, followed by the ASCII bytes for `"RIDE"` and a
UTF-8-encoded payload:
```
    8+len(payload)   "Ride" magic number   payload
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

### UnknownCommand <a name=UnknownCommand></a>
If the receiver of a message does not recognise it, it should respond with
```json
["UnknownCommand",{"name":"Xyz"}]
```

### InternalError <a name=InternalError></a>
Should the interpreter generate an error during the processing of an incoming Ride message it will respond with an InternalError message:
```json
["InternalError",{"error":1,"error_text":"WS FULL","dmx":"","message":"Edit"}]
```
* `error`: aka ⎕EN
* `error_text`: aka ⎕EM 
* `dmx`: the DMX message for the error (currently always empty)
* `message`: the name of the originating incoming Ride message

The connection may be closed at any time, leaving some messages undelivered or unprocessed.

Command names and their arguments are case-sensitive.

JSON booleans `true` and `false` can be freely substituted with and should be treated as equivalent to `1` and `0`.

## Connection setup and teardown

### Identify <a name=Identify></a>
After the connection has been established and a protocol agreed, both peers immediately send an `Identify` message to indicate what type of application they are.
```json
["Identify",{"apiVersion":1,"identity":1}]
```
The `apiVersion` is introduced as a mechanism to handle breaking changes in the API.

Constants for `identity`:
- `1` Ride,
- `2` interpreter,
- `3` process manager.

:red_circle: The interpreter sends an `Identify` that means something else and has different args.

#### apiVersion < 1
The interpreter responds with an Identify messsage containing details about the interpreter.

#### apiVersion = 1
The interpreter responds with a `ReplyIdentify` messsage containing details about the interpreter.

They should then check the type of application they are connected to, and if not happy to continue, close the connection.  For instance, Ride may check that the application it's connected to is an interpreter or a process manager. If it finds the peer is another Ride, it should close the connection.

:red_circle: In reality Ride doesn't bother verifying that it's not talking to another Ride.

### ReplyIdentify <a name=ReplyIdentify></a>
#### apiVersion = 1
The interpreter responds with a `ReplyIdentify` messsage containing details about the interpreter.
```json
["ReplyIdentify",{ // Interpreter -> Ride
  "apiVersion":1,
  "Port":0,
  "IPAddress":"",
  "Vendor":"Dyalog Limited",
  "Language":"APL",
  "version":"18.2.46943",
  "Machine":"HOSTNAME",
  "arch":"Unicode/64",
  "Project":"CLEAR WS",
  "Process":"dyalog.exe",
  "User":"username",
  "pid":1000,
  "token":"{F53F7747-B404-4F7A-893D-954F2764CC74}",
  "date":"Created: Apr 10 2023 at 19:29:32",
  "platform":"Windows-64"
}]
```
The `apiVersion` specifies the negotiated API version accepted by the interpreter.

### GetLog <a name=GetLog></a>
#### apiVersion = 1
Request the session log from the interpreter. 
```json
["GetLog",{"format":"json","maxLines":100}] // Ride -> Interpreter
```
`format` defaults to "json" if not specified.
`maxLines` limits the number of lines returned (-1 = unlimited)

### ReplyGetLog <a name=ReplyGetLog></a>
#### apiVersion < 1
After it has received the Connect command the interpreter will send 0 or more "ReplyGetLog" messages containing the session log:
```json
["ReplyGetLog",{"result":["line 1","line 2"]}] // Interpreter -> Ride
```

#### apiVersion = 1
After it has received a "GetLog" command the interpreter will send 0 or more "ReplyGetLog" messages containing the session log in the format requested.
For `text` format:
```json
["ReplyGetLog",{"result":["line 1","line 2"]}] // Interpreter -> Ride
```
For `json` format:
```json
["ReplyGetLog",{"result":[ // Interpreter -> Ride
  {
    "group": 1,
    "type": 1,
    "text": "line 1",
  },{
    "group": 1,
    "type": 1,
    "text": "line 2",
  },
  ]}]
```

### SysError <a name=SysError></a>
If at any time the interpreter crashes with a [syserror](http://help.dyalog.com/latest/Content/Language/Errors/System%20Errors.htm), it sends;
```json
["SysError",{"text":"apl: sys error 123 errno 456","stack":""}] // Interpreter -> Ride
```

### Exit <a name=Exit></a>
If the interpreter has been started by Ride, Ride should shut it down cleanly when the user closes the main application
window (the session window):
```json
["Exit",{"code":0}] // Ride -> Interpreter
```

## Session control

#### apiVersion < 1
Any echoed input or interpreter output are sent to Ride using either;
### EchoInput <a name=EchoInput></a>
```json
["EchoInput",{"input":"      1 2 3+4 5 6\n"}] // Interpreter -> Ride
```
### AppendSessionOutput <a name=AppendSessionOutput></a>
```json
["AppendSessionOutput",{"result":"5 7 9"}]  // Interpreter -> Ride
```
These two perform essentially the same task except that `AppendSessionOutput` doesn't necessarily have trailing `"\n"`-s at the end of `result`.

#### apiVersion = 1
Any echoed input or interpreter output are sent to Ride using either;
```json
["AppendSessionOutput",{"result":"5 7 9","type":1,"group":1}]  // Interpreter -> Ride
```
`type` specifies the source of the output:

|type| description                                  |
|----|----------------------------------------------|
| 0  | reserved                                     |
| 1  | undetermined session output                  |
| 2  | default output e.g. not assigned to ⎕ or ⍞ |
| 3  | what would have been always sent to stderr   |
| 4  | output from system commands                  |
| 5  | APL error message. e.g. ^ and DOMAIN ERROR   |
| 6  | reserved                                     |
| 7  | ⎕ output                                    |
| 8  | ⍞ output                                    |
| 9  | "information" that would have gone to the "status window" |
| 10 | reserved                                     |
| 11 | echoed input                                 |
| 12 | ⎕TRACE output                               |
| 13 | reserved                                     |
| 14 | A “normal” input line                        |

### SetPromptType <a name=SetPromptType></a>
The interpreter informs Ride about changes in its ability to accept user input with
```json
["SetPromptType",{"type":5}] // Interpreter -> Ride
```
Constants for `type`: 
- `0` no prompt,
- `1` the usual 6-space APL prompt (a.k.a. Descalc or "desktop calculator"),
- `2` [Quad(`⎕`)](http://help.dyalog.com/latest/Content/Language/System%20Functions/Evaluated%20Input%20Output.htm) input,
- `3` line editor,
- `4` [Quote-Quad(`⍞`)](http://help.dyalog.com/latest/Content/Language/System%20Functions/Character%20Input%20Output.htm) input,
- `5` any prompt type unforeseen here.

:red_circle: These modes need explaining with expected behaviour.


### Execute <a name=Execute></a>
When the user presses `<ER>` (Enter) or `<TC>` (Ctrl-Enter), Ride sends
```json
["Execute",{"text":"      1 2 3+4 5 6","trace":1}] // Ride -> Interpreter
```
* `text`: the APL code to evaluate
* `trace`: 0 = execute
           1 = evaluate in the tracer (`<TC>`)
           2 = evaluate in the tracer token by token (`<TP>`)

Note that Ride can't assume that everything entered in the session will be echoed, e.g. quote quad input (`⍞`) doesn't
echo.  Therefore, Ride should wait for the [`EchoInput`](#EchoInput) message.

If multiple lines have been modified in the session, Ride should queue them up and send them one by one, waiting for
a response of either `SetPromptType` with `type>0` or HadError.
### HadError <a name=HadError></a>
Ride should clear its queue of pending lines on `HadError` and focus the session.
```json
["HadError",{}] // Interpreter -> Ride
```

### SetPW <a name=SetPW></a>
Ride can optionally advise the interpreter about the session's width in characters with
```json
["SetPW",{"pw":79}] // Ride -> Interpreter
```
Further output will wrap at that width (with a few exceptions).
See [`⎕PW`](http://help.dyalog.com/latest/Content/Language/System%20Functions/pw.htm).


## Window management

### Edit <a name=Edit></a>
When the user presses `<ED>` (Shift-Enter), Ride should send;
```json
["Edit",{"win":123,"text":"a←b+c×d","pos":4,"unsaved":{"124":"f"}}] // Ride -> Interpreter
```
to request opening an editor.  `pos` is the 0-based position of the cursor in `text`.
`unsaved` is a mapping from window ids to unsaved content.

:red_circle: "Edit" must be extended to submit the current content of all dirty windows, otherwise jumping from one
method to another in a class will obliterate the current changes.

### ShowAsArrayNotation <a name=ShowAsArrayNotation></a>
When user clicks on button `[⋄]` in an editor window for a variable that can be edited as APLAN, Ride should send;
```json
["ShowAsArrayNotation",{"win":123}] // Ride -> Interpreter
```
to request an update to the window with content changed to array notation. The interpreter will respond with a separate `UpdateWindow` command.

### OpenWindow <a name=OpenWindow></a>
The interpreter will parse that and may respond later with one of;
```json
["OpenWindow",{"name":"f","filename":"C:\\path\\to\\foo.txt","text":["r←f a","r←(+⌿÷≢)a"],"token":123,"currentRow":0,"debugger":false,
               "entityType":1,"offset":0,"readOnly":false,"size":0,"stop":[1],
               "tid":0,"tname":"Tid:0"}] // Interpreter -> Ride
```
### UpdateWindow <a name=UpdateWindow></a>
```json
["UpdateWindow",...] // Interpreter -> Ride (same args as OpenWindow)
```
It may also send these in response to [`)ed
name`](http://help.dyalog.com/latest/Content/Language/System%20Commands/ed.htm) or
[`⎕ed'name'`](http://help.dyalog.com/latest/Content/Language/System%20Functions/ed.htm), as well as when tracing into an
object that is not currently being traced.

Constants for `entityType`:

| entityType | Description | | entityType | Description |
| --- | --- | --- | --- | --- |
| `1` |  defined function | | `128` |  simple character vector
| `2` |  simple character array | | `256` |  APL namespace
| `4` |  simple numeric array | | `512` |  APL class
| `8` |  mixed simple array | | `1024` |  APL interface
| `16` |  nested array | | `2048` |  APL session
| `32` |  [`⎕OR`](http://help.dyalog.com/latest/Content/Language/System%20Functions/or.htm) object | | `4096` |  external function
| `64` |  native file | | `262144` | array notation (APLAN)

:red_circle: TODO: describe the other arguments


### GotoWindow <a name=GotoWindow></a>
The interpreter can request transferring the focus to a particular window with;
```json
["GotoWindow",{"win":123}] // Interpreter -> Ride
```
This could happen as a result of `)ED` or `⎕ED`.


### WindowTypeChanged <a name=WindowTypeChanged></a>
The interpreter may decide to change the type of a window (editor vs tracer) with;
```json
["WindowTypeChanged",{"win":123,"tracer":true}] // Interpreter -> Ride
```


### SaveChanges <a name=SaveChanges></a>
When the user presses `<EP>` (Esc), Ride should request that the editor contents are fixed through;
```json
["SaveChanges",{"win":123,"text":["r←avg a","s←+⌿a","n←≢a","r←s÷n"],"stop":[2,3]}] // Ride -> Interpreter
```
- `stop` is an array of 0-based line numbers.


### ReplySaveChanges <a name=ReplySaveChanges></a>
```json
["ReplySaveChanges",{"win":123,"err":0}] // Interpreter -> Ride
```
If `err` is 0, save succeeded; otherwise it failed.


### FormatCode <a name=FormatCode></a>
Ride can request that the intepreter reformat code:
```json
["FormatCode",{"win":123,"text":["r←avg a","s←+⌿a","n ←    ≢a","r←s÷n"]}] // Ride -> Interpreter
```


### ReplyFormatCode <a name=ReplyFormatCode></a>
```json
["ReplyFormatCode",{"win":123,"text":["r←avg a","s←+⌿a","n←≢a","r←s÷n"]}] // Interpreter -> Ride
```
* `win`: TENTATIVE: a window identifer. The interpreter needs a window in which to format the code (don't ask!). In the short term we'll insist that we can only format code in a window the interpreter is aware of.


### CloseWindow <a name=CloseWindow></a>
When the user presses `<EP>` (Esc) and saving is successful or presses `<QT>` (Shift-Esc), Ride sends;
```json
["CloseWindow",{"win":123}] // Ride -> Interpreter  and  Interpreter -> Ride
```
but does not close the UI window until the interpreter replies with the same message.


### CloseAllWindows <a name=CloseAllWindows></a>
To close all windows, but leave the SIstack unchanged Ride can send the CloseAllWindows message.
```json
["CloseAllWindows",{}] // Ride -> Interpreter
```
In response the interpreter will send a CloseWindow messsage for each window that it is aware of. The CloseAllWindows message will leave the SIStack unchanged, it will just close all (trace and edit) windows in the interpreter.

## Debugging
The following messages are used in relation to trace windows.

### SetHighlightLine <a name=SetHighlightLine></a>
This tells Ride where the currently executed line is.  Traditionally that's indicated by a red border around it.
Optionally, provides end line and start/end column of area to highlight with `end_line`, `start_col` and `end_col`.
```json
["SetHighlightLine",{"win":123,"line":1,"end_line":1,"start_col":-1,"end_col":-1}] // Interpreter -> Ride
```

### SetLineAttributes <a name=SetLineAttributes></a>
Update the breakpoints.
```json
["SetLineAttributes",{"win":123,"stop":[2,3,5]}] // Ride -> Interpreter  or  Interpreter -> Ride
```
- `stop` is an array of 0-based line numbers.


### TraceBackward <a name=TraceBackward></a>
Request the current line in a trace window be moved back (skip back one line).
```json
["TraceBackward",{"win":123}] // Ride -> Interpreter
```


### ClearTraceStopMonitor <a name=ClearTraceStopMonitor></a>
Request it clears all traces, stops, and monitors in the active workspace. The reply says how many of each thing were cleared.
```json
["ClearTraceStopMonitor",{"token":123}] // Ride -> Interpreter
```

### ReplyClearTraceStopMonitor <a name=ReplyClearTraceStopMonitor></a>
```json
["ReplyClearTraceStopMonitor",{"traces":0,"stops":0,"monitors":0,"token":123}] // Interpreter -> Ride
```

### Continue <a name=Continue></a>
Request resume execution of the current thread.
```json
["Continue",{"win":123}] // Ride -> Interpreter
```

### ContinueTrace <a name=ContinueTrace></a>
Request resume execution of the current function, but stop on the next line of the calling function.
```json
["ContinueTrace",{"win":123}] // Ride -> Interpreter
```

### Cutback <a name=Cutback></a>
Request the stack is cut back one level.  This is equivalent to returning to the caller without executing the rest of the current function.
```json
["Cutback",{"win":123}] // Ride -> Interpreter
```

### TraceForward <a name=TraceForward></a>
Request the current line in a trace window be moved forward (skip to next line).
```json
["TraceForward",{"win":123}] // Ride -> Interpreter
```


### RestartThreads <a name=RestartThreads></a>
Request resume execution of all threads.
```json
["RestartThreads",{}] // Ride -> Interpreter
```


### RunCurrentLine <a name=RunCurrentLine></a>
Request the current line in a trace window is executed. (Step over)
```json
["RunCurrentLine",{"win":123}] // Ride -> Interpreter
```

### StepInto <a name=StepInto></a>
```json
["StepInto",{"win":123}] // Ride -> Interpreter
```
Request the current line in a trace window is executed. (Step into)

### TracePrimitive <a name=TracePrimitive></a>
```json
["TracePrimitive",{"win":123}] // Ride -> Interpreter
```
Request the current line in a trace window is executed primitive but primitive.


## Status Bar
Ride requests status information from the interpreter to display in the status bar.

### Subscribe <a name=Subscribe></a>
Ride 4.4 now uses the Subscribe method to retrieve information from the interpreter for the status bar. Protocol messages are sent by the interpreter when a change is detected, as opposed to polling at an interval.
```json
["Subscribe", { // Ride -> Interpreter
  "status": [  // 0 or more of the following values
               // values are not saved between calls       
    "statusfields",   // will result in InterpreterStatus messages
    "stack" ,         // will result in ReplyGetSIStack messages
    "threads"         // will result in ReplyGetSIStack messages
  ],
  "heartbeat": interval    // interval is currently ignored
}]
```
There is no unsubscribe method, a new Subscribe message should be sent with the relevant fields removed.

### InterpreterStatus <a name=InterpreterStatus></a>
```json
["InterpreterStatus", { // Interpreter -> Ride
   "IO": int,   // current ⎕IO
   "DQ": int,   // length of current message queue 
   "WA": int,   // current available workspace (not currently implemented)
   "SI": int,   // length of current SI stack
   "TRAP": int, // Is there an active trap?
   "ML": int,   // // current ⎕ML
   "NumThreads": int, // current number of threads
   "TID": int, // current thread id
   "CompactCount": int, // number of compactions so far
   "GarbageCount": int  // number of garbage collections so far (i.e. number of collections that have found garbage)
}]
```

### InterpreterHeartBeat <a name=InterpreterHeartBeat></a>
```json
["InterpreterHeartBeat", { // Interpreter -> Ride
    "ping" : "ping"  // maybe there will be additional reasons to ping
}]
```

## Threads

### GetSIStack <a name=GetSIStack></a>
Request information about the current stack.
```json
["GetSIStack",{}] // Ride -> Interpreter
```

### ReplyGetSIStack <a name=ReplyGetSIStack></a>
```json
["ReplyGetSIStack",{"stack":[{"description":"#.f[12]*"},{"description":"#.g[34]"}],"tid":2}] // Interpreter -> Ride
```

### GetThreads <a name=GetThreads></a>
Get information about the current threads.
```json
["GetThreads",{}] // Ride -> Interpreter
```

### ReplyGetThreads <a name=ReplyGetThreads></a>
```json
["ReplyGetThreads",{"threads":[
    {"description":"","state":"Session","tid":0,"flags":"Normal","Treq":""},
    ]}] // Interpreter -> Ride
```
* `description`: a text description of the thread. Derived from the Tid and ⎕TNAME for the thread
* `state`: a string indicating the current location of the thread
* `tid`: the Tid (numeric)
* `flags`: e.g. Normal, Paused or Terminated
* `Treq`: a string indicating any tokens that the thread is waiting for.


### SetThread <a name=SetThread></a>
Request the interpreter focus a specific thread.
```json
["SetThread", {"tid":123}] // Ride -> Interpreter
```


### ReplySetThread <a name=ReplySetThread></a>
```json
["ReplySetThread", {"tid":123, "rc":321, "message":"txt"}] // Interpreter -> Ride
```
* `tid`: the thread ID (numeric)
* `rc`: Return code. TID of focused thread, or -1 if unsuccessful.
* `message`: Empty, or text description of the result if unsuccessful.


### GetThreadAttributes <a name=GetThreadAttributes></a>
Request attributes on multiple threads:
```json
["GetThreadAttributes",{ // Ride -> Interpreter
  "threads":[123 | -1]
}]
```
If first item is -1, return info for all threads and stop processing. If -1 is found after first, return non zero in rc for that element.


### ReplyGetThreadAttributes <a name=ReplyGetThreadAttributes></a>
```json
["ReplyGetThreadAttributes",{ // Interpreter -> Ride
  "threads":[{
    "tid": 123,
    "rc": 321,
    "paused": 1,
    "noninterruptable": 2,
  }]
}]
```
* `tid`: The thread ID (numeric)
* `rc`: Return code. TID of thread, or -1 if unsuccessful.
* `paused`: boolean
* `noninterruptable`: int;
  - `0`: interruptable,
  - `1`: non-interruptable,
  - `2`: children will be created as non-interruptable


### SetThreadAttributes <a name=SetThreadAttributes></a>
Set attributes on multiple threads.
```json
["SetThreadAttributes",{ // Ride -> Interpreter
  "threads":[{
    "tid":123,
    "paused":0,
    "noninterruptable": 2,
  }]
}]
```
If first item's tid is -1, set info for all threads and stop processing.
The interpreter will respond with ReplySetThreadAttributes

### ReplySetThreadAttributes <a name=ReplySetThreadAttributes></a>
```json
["ReplySetThreadAttributes",{ // Interpreter -> Ride
  "threads":[{
    "tid":123,
    "rc":0,
    "paused":0,
    "noninterruptable":2,
  }]
}]
```
* `tid`: The thread ID (numeric)
* `rc`: Return code. TID of thread, or -1 if unsuccessful.
* `paused`: boolean
* `noninterruptable`: int;
  - `0`: interruptable,
  - `1`: noninterruptable,
  - `2`: children will be created as non-interruptable


### PauseAllThreads <a name=PauseAllThreads></a>
To pause all threads, pass a 1. To unpause all paused threads, pass a 0.
```json
["PauseAllThreads", { "pause": 1 | 0}]
```
PauseAllThreads (pause=0) does not "restart" all threads, you'll need to send RestartThreads if that's what you want.
PauseAllThreads does not send any response.


## Interrupts
APL supports two kinds of interrupts;

### WeakInterrupt <a name=WeakInterrupt></a>
```json
["WeakInterrupt",  {}] // Ride -> Interpreter
```

### StrongInterrupt <a name=StrongInterrupt></a>
```json
["StrongInterrupt",{}] // Ride -> Interpreter
```
The interpreter message queue should check for strong interrupts and handle them immediately without needing to fully
parse messages.

:red_circle: I've no idea what the above sentence means -Nick

## Autocompletion

### GetAutocomplete <a name=GetAutocomplete></a>
Ride can request autocompletion information from the interpreter.
```json
["GetAutocomplete",{"line":"r←1+ab","pos":6,"token":234}] // Ride -> Interpreter
```
* `line`: text containing the name that's being completed
* `pos`: position of cursor within `line`
* `token`: is used by [`ReplyGetAutocomplete`](#ReplyGetAutocomplete) to identify which request it is a response to. Ride
may send multiple `GetAutocomplete` requests and the interpreter may only reply to some of them. Similarly, Ride may
ignore some of the replies if the state of the editor has changed since the `GetAutocomplete` request was sent.
In order to remain responsive, Ride should throttle its autocompletion requests (no more than N per second) and it
shouldn't block while it's waiting for the response.

:red_circle: The interpreter requires that "token" is the id of the window, so perhaps it should be renamed "win".

:red_circle: If Ride sends a different token, the interpreter doesn't respond.


### ReplyGetAutocomplete <a name=ReplyGetAutocomplete></a>
```json
["ReplyGetAutocomplete",{"skip":2,"options":["ab","abc","abde"],"token":234}] // Interpreter -> Ride
```
* `skip`: how many characters before the request's `pos` to replace with an element of `options`

## Value tips

### GetValueTip <a name=GetValueTip></a>
When the user hovers a name with the mouse, Ride should ask for a short textual representation of the current value:
```json
["GetValueTip",{"win":123,"line":"a←b+c","pos":2,"maxWidth":50,"maxHeight":20,"token":456}] // Ride -> Interpreter
```

### ValueTip <a name=ValueTip></a>
```json
["ValueTip",{"tip":["0 1 2","3 4 5"],"class":2,"startCol":2,"endCol":3,"token":456}] // Interpreter -> Ride
```

* `token`: is used to correlate requests and responses, and there is no guarantee that they will arrive in the same order, if ever (like with autocompletion).
* `maxHeight` and `maxWidth` can be used to limit the number of lines and columns in the result.
* `class` indicates the [nameclass](http://help.dyalog.com/latest/Content/Language/System%20Functions/nc.htm) of the object. This information can be used to syntax-highlight the tooltip.
* `startCol` and `endCol` describe the position of the whole name to which the value tip pertains. `startCol` is inclusive and `endCol` is exclusive.



## Dialogs
The interpreter can ask Ride to interact with the user by showing a modal dialog.
Several kinds of dialogs are supported:

### Options dialog
<a name=OptionsDialog></a>
```json
["OptionsDialog",{"title":"","text":"","type":1,"options":["Yes","No","Cancel"],"token":123}] // Interpreter -> Ride
```

### ReplyOptionsDialog <a name=ReplyOptionsDialog></a>
```json
["ReplyOptionsDialog",{"index":0,"token":123}] // Ride -> Interpreter
```

Constants for type:
- `1` warning,
- `2` information,
- `3` question,
- `4` stop.

If the user closes the dialog without choosing an option, Ride responds with an `index` of `-1`.


### StringDialog <a name=StringDialog></a>
```json
["StringDialog",{"title":"Name","text":"Please enter a name:","initialValue":"abc","defaultValue":null,"token":123}] // Interpreter -> Ride
```

### ReplyStringDialog <a name=ReplyStringDialog></a>
```json
["ReplyStringDialog",{"value":"abcd","token":123}] // Ride -> Interpreter
```

### TaskDialog <a name=TaskDialog></a>
A "task dialog" shows two sets of buttons -- vertically aligned `buttonText` and below them the horizontally aligned `options`.
```json
["TaskDialog",{"title":"Save document","text":"Save document options",
               "subtext":"Do you want to save the changes to the document?",
               "buttonText":["Save in XML base format","Save in binary format"],
               "options":["No","Cancel"],
               "footer":"Note: If you don't choose to save, your changes will be lost",
               "questionkey":"SaveFileOptionsExtension:.xml",
               "questionlabel":"Save this response for all files with a \".xml\" extension"}] // Interpreter -> Ride
```

### ReplyTaskDialog <a name=ReplyTaskDialog></a>
```json
["ReplyTaskDialog",{"index":"101","token":123}] // Ride -> Interpreter
```
In the response `index` can be:
* `100+i` where `i` is the index of a `buttonText` button
* the index of an `options` button
* `-1` if the user closes the dialog


### NotificationMessage <a name=NotificationMessage></a>
```json
["NotificationMessage",{"message":"Object too large to edit","token":123}] // Interpreter -> Ride
```

## Other

### ShowHTML <a name=ShowHTML></a>
Request Ride shows some HTML. See [`3500⌶`](http://help.dyalog.com/latest/Content/Language/Primitive%20Operators/Send%20Text%20to%20RIDE-embedded%20Browser.htm).
```json
["ShowHTML",{"title":"Example","html":"<i>Hello</i> <b>world</b>"}] // Interpreter -> Ride
```


### UpdateDisplayName <a name=UpdateDisplayName></a>
This message is sent by the interpreter when WSID is changed.
```json
["UpdateDisplayName",{"displayName":"CLEAR WS"}] // Interpreter -> Ride
```

### UpdateSessionCaption <a name=UpdateSessionCaption></a>
Ride can use the display name as the title of its application window.
```json
["UpdateSessionCaption",{"text":"CLEAR WS - Dyalog APL/W-64"}] // Interpreter -> Ride
```


### Disconnect <a name=Disconnect></a>
Sent from any peer to shut down the connection cleanly.
```json
["Disconnect",{"message":"..."}]
```
:red_circle: Why do we need "Disconnect"?  Why not just close the TCP connection?  That shouldn't be any less "clean".


## Workspace explorer
Optionally, Ride can display a tree representing session content.

### TreeList <a name=TreeList></a>
It can query information about the children of a particular node with TreeList.
```json
["TreeList",{"nodeId":12}] // Ride -> Interpreter
```

### ReplyTreeList <a name=ReplyTreeList></a>
```json
["ReplyTreeList",{"nodeId":12,"nodeIds":[34,0],"names":["ab","cde"],
                  "classes":[9.4,3.2],"err":""}] // Interpreter -> Ride
```

The root of the tree is assumed to have a node id of 0.
* `nodeId` is the requested parent id.
* `nodeIds` are the ids of the children; some of them can be 0 -- those children can't themselves have children.
* `classes` are [name classes](http://help.dyalog.com/latest/Content/Language/System%20Functions/nc.htm#NameClassification)
  that can be used to choose appropriate styling
* `err` is non-empty only when an error has occurred in the interpreter, e.g. when `nodeId` is no longer invalid

Ride should query information only about the visible parts of the tree as they get expanded.

When the user presses Enter or clicks on an editable node, Ride should use the [Edit](#Edit) command to notify the
interpreter.  Then it can send back commands to open or focus an editor window.


## Status window

### StatusOutput <a name=StatusOutput></a>
The interpreter may request the display of messages in a separate "Status Output" window.
```json
["StatusOutput",{"text":"some very important message\r\n","flags":2}] // Interpreter -> Ride
```
`flags` (despite its name) is the message type, one of:
* `1`: info, usually shown in green
* `2`: error, red
* `4`: warning, blue
* `8`: .Net function overload clash overload (red?)


## Process manager
:red_circle: As of April 2016 there is no process manager.


### GetAvailableConnections <a name=GetAvailableConnections></a>
```json
["GetAvailableConnections",{"connections":[c0,c1,...]}] // Ride or Interpreter -> PM
```
:red_circle: Specify what c0,c1,... look like


### ConnectTo <a name=ConnectTo></a>
Request a connection to a specific item (Ride or interpreter).
```json
["ConnectTo",{"remoteId":123}] // Ride or Interpreter -> PM
```

### ConnectToSucceded <a name=ConnectToSucceded></a>
Tell the client that the ProcessManager is handing off the connection to a Ride or Interpreter (as requested).
The process manager knows the supported protocols so it can pick a supported protocol for the clients to switch to.
Once this is received the client is no longer connected to the PM, but rather is connected to the specified process.
```json
["ConnectToSucceded",{"remoteId":123,"identity":1,"protocolNumber":...}] // PM -> Ride or Interpreter
```
`identity`: see [Identify](#Identify)


### ConnectToFailed <a name=ConnectToFailed></a>
Tell the client that the attempt to connect to a particular process failed.
```json
["ConnectToFailed",{"remoteId":123,"reason":""}] // PM -> Ride or Interpreter
```

### GetDetailedInformation <a name=GetDetailedInformation></a>
```json
["GetDetailedInformation",{"remoteId":[12,34,...]}] // anything -> anything
```
If sent to a Process manager, `remoteId` is a list of remote IDs returned by
[`GetAvailableConnections`](#GetAvailableConnections). Otherwise it's an empty list.


### ReplyGetDetailedInformation <a name=ReplyGetDetailedInformation></a>
```json
["ReplyGetDetailedInformation",{"information":[i0,i1,...]}] // anything -> anything
```

## Session Information and Configuration

### Help

#### GetHelpInformation <a name=GetHelpInformation></a>
Ride can request help on current cursor position.
```json
["GetHelpInformation",{"line":"r←1+ab","pos":4}] // Ride -> Interpreter
```
* `line`: text containing the name where help is requested
* `pos`: position of cursor within `line` (origin 0 is to the left of the first character)

#### ReplyGetHelpInformation <a name=ReplyGetHelpInformation></a>
```json
["ReplyGetHelpInformation",{"url":"https://help.dyalog.com/18.1/#Language/Symbols/Plus%20Sign.htm"}] // Interpreter -> Ride
```

### Syntax

#### GetSyntaxInformation <a name=GetSyntaxInformation></a>
Ride can request Syntax information specific to the version of the interpreter being run.
```json
["GetHelpInformation",{}] // Ride -> Interpreter
```

###⍕ ReplyGetSyntaxInformation <a name=ReplyGetSyntaxInformation></a>
```json
["ReplyGetSyntaxInformation",{"url":"https://help.dyalog.com/18.1/#Language/Symbols/Plus%20Sign.htm"}] // Interpreter -> Ride
```

### LanguageBar

#### GetLanguageBar <a name=GetLanguageBar></a>
Ride can request Language bar information specific to the version of the interpreter being run.
```json
["GetLanguageBar",{}] // Ride -> Interpreter
```

#### ReplyGetLanguageBar <a name=ReplyGetLanguageBar></a>
```json
["ReplyGetLanguageBar",{  // Interpreter -> Ride
  "entries":[
    {"name":"Left Arrow", "avchar":"←", "helptext":["...","...",]}
    ]}]
```

### Configuration

#### GetConfiguration <a name=GetConfiguration></a>
Configuration parameters can be queried using the GetConfiguration method
```json
["GetConfiguration", {"names":["text"] // Ride -> Interpreter
```

#### ReplyGetConfiguration <a name=ReplyGetConfiguration></a>
```json
["ReplyGetConfiguration", { // Interpreter -> Ride
  "configurations":[
    {"name":"string", "value":""},
    ]}]
```

#### SetConfiguration <a name=SetConfiguration></a>
Parameters can be set using the SetConfiguration method. *[Currently only the AUTO_PAUSE_THREADS parameter is supported.]*
```json
["SetConfiguration", { // Ride -> Interpreter
  "configurations": [
    {"name":"", "value":""},
    ]}]
```

#### ReplySetConfiguration <a name=ReplySetConfiguration></a>
```json
["ReplySetConfiguration", { // Interpreter -> Ride
  "configurations": [
    {"name":"", "rc":0123,},
    ]}]
```

* `name`: key of paramenter to set.
* `value`: value to set it to.
* `rc`: int, one of the following;
  - `0`: SO_OK
  - `1`: SO_BAD_NAME
  - `2`: SO_BAD_VALUE
  - `3`: SO_CANT_SET

## Proposed extensions
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

### SetCurrentObject <a name=SetCurrentObject></a>
```json
["SetCurrentObject",{"text":""}] // Ride -> Interpreter
```
* compiler information
* list of valid I-beams and their descriptions
* `ShowStack` and `ShowThreads`
* drop workspace in Ride
