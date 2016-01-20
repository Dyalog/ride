=Overview=
This is a refactored version of the V1 messages.  NB – Not completed yet!

Messages are a combination of a name and unordered set of name/value pairs.

* The Reply prefix on some messages is a hangover from the RIDE prototype code.
* Messages are independent and after the initial connection setup can be sent/received in any order. Some messages infer that the other end will send a reply, but that reply may not be the next message to be received, or even ever be sent. 
* The connection may be closed at any time, leaving some messages undelivered or unprocessed.

=Initial connection setup=
After the connection has been established and a protocol agreed all applications immediately send an Identify message to indicate what type of application they are.
They should then check the type of application they are connected to, and if not happy to continue close the connection.

E.g. a RIDE should send an Identify(RIDE) message and then check that the application it's connected to is an interpreter or a process manager. If it finds the peer is
a RIDE it should close the connection.

After a RIDE connects to an interpreter it can get the current state of the interpreter by sending GetCurrentSession and UpdateAllWindows messages. It can also request a 
language bar if required.

In general the client (end that initiated the connection) should request the information it needs. The server (end receiving the connection) should not assume the information that is required.
Rather it should just reply to requests for information and send appropriate messages when it's state changes.

=Message set V2=
Message names and properties are case insensitive.

NN: case-sensitive in RIDE2

ROS: indeed, case-sensitivity of names is mandated by the use of JSON

NN: JSON is just the transfer format.  How messages are interpreted (case-sensitively or not) is the concern of the endpoints.  Anyway, I would prefer everything here to be case-sensitive.  It's easy to go from this to a case-insensitive protocol, even after the spec is published.  In the opposite direction it doesn't work that well.

==Sent from RIDE to interpreters==

 <nowiki>
CanSessionAcceptInput []
  Establish if the session can accept input.
    NN: Not used in RIDE2.  This information is already available through AtInputPrompt.

TraceBackward [int win]
  Request the current line in a trace window be moved back.

ClearTraceStopMonitor [int win]
  Request it clears all breakpoints, stops and monitors for a trace window.
    NN: Not used in RIDE2.

Continue [int win]
  Request restart of the APL program. (Black arrow in ODE)

ContinueTrace [int win]
  Request resumption of tracing an APL program. (White arrow in ODE)

ContinueAllThreads [int win]
  Request resumption of all threads. (Green arrow in ODE)
    NN: Not used in RIDE2.  The green arrow actually corresponds to "RestartThreads".

Cutback [int win]
  Request the stack is cut back one level.

TraceForward [int win]
  Request the current line in a trace window be moved forward.

RestartThreads [int win]
  Request all suspended threads are restarted.

RunCurrentLine [int win]
  Request the current line in a trace window is executed. (Step over)

StepInto [int win]
  Request the current line in a trace window is executed. (Step into)

UnpauseThreads [int win]
  Request all suspended threads are resumed from their current position.
    NN: Not used in RIDE2.

Edit [int win, int pos, string text]
  Request opening an editor on the term at the given position in edit.

Execute [string text, bool trace]
  Text => to evaluate
  Trace = true => the expression should be evaluated in the tracer 

GetAutoComplete [string line, int pos, int token]
  The token is used by ReplyGetAutoComplete to identify which AutoComplete request it is a response to. The 
  RIDE may send multiple GetAutoComplete requests and the interpreter may only reply to some of them. Similarly the RIDE 
  may ignore some of the replies if the state of the editor has changed since the GetAutoComplete request was sent.
  line => Text containing term to get autocomplete data for.
  pos => Position in the line to use for autocomplete information.
  token => Token to identify this request, will be returned by ReplyGetAutoComplete. 
    NN: The interpreter requires that "token" is the id of the window, so perhaps it should be renamed "win".
    NN: If RIDE sends a different token, the interpreter doesn't respond.
    NN: I think the C in AutoComplete shouldn't be capitalised as "autocomplete" is one word

SaveChanges [int win, string text, lineAttributes attributes]
  Request that the contents of an editor are fixed.

WeakInterrupt []
  Request a weak interrupt.

GetLanguageBar []
  Request that the interpreter sends a language bar.
    NN: Not used in RIDE2.  Information about the language bar is known in advance, there's no need to send it through the protocol.

GetSessionContent []
  Request the current content of the session.
    NN: Not used in RIDE2.  The interpreter side sends the session content automatically on connection.

UpdateAllWindows []
  Request the interpreter sends UpdateWindow messages for all currently open windows.
    NN: Not used in RIDE2.

StrongInterrupt []
  StrongInterrupt.  The interpreter message queue should check for strong interrupts and handle them immediately without needing to fully parse messages.

Exit [int code]
  Request that the interpreter process exits.  This is useful for cleanly shutting down a locally spawned interpreter.
    NN: Added on 2015-04-21.
</nowiki>

==Sent from the interpreter to RIDE==
 <nowiki>
AtInputPrompt [inputModeState why]
  Inform RIDE that session input should be allowed, and the reason why. RIDE uses this information to determine when to display the six space prompt.

ReplyCanSessionAcceptInput [bool canAcceptInput]
  Inform RIDE whether or not the session can currently accept input.
  Note: This is a hack and should go away...

EchoInput [string input]
  Note that RIDE will append a newline before displaying the input.
  Note: RIDE can’t assume that everything entered in the session should be echoed. e.g. quote quad input.

OpenWindow [editableEntity entity]
  Request a new editor or tracer window.

AppendSessionOutput [string result]
  Display text in the session.
  Should be used for initial display of the session log, as well as other output.

FocusWindow [int win]
  Request that RIDE puts the focus into a particular window.

ReplyGetAutoComplete [int skip, string[] options, int token]
  Sent in response to a GetAutoComplete message.
    NN: RIDE2 supports this command in a slightly different format, legacy from before I switched to RIDE protocol v2.

LanguageBar [LanguageBarElement[] elements]
  Sent if the language bar is requested or updated.
    NN: not used in RIDE2

HadError []
  Sent if evaluating an expression generates an error. If RIDE has any pending expressions to evaluate it should discard them.

HighlightLine [lineInfo info]
  Request that RIDE sets the position of the current line marker in a trace window.
    NN: RIDE2 supports this command in a slightly different format, legacy from before I switched to RIDE protocol v2.
 
NotAtInputPrompt []
  Tell RIDE to disable session input.		

ReplySaveChanges [int win, int err]
  Sent in response to a SaveChanges message.
  If err = 0 save succeeded, otherwise it failed.

ShowHTML [string title, string html]
  Request RIDE shows some HTML.

StatusOutput [statusInfo info]
  Status information that should be displayed to the user.
  NN: Not supported in RIDE but likely will be in the future.

SysError [string text, string stack]
  Sent after a syserror before the interpreter terminates.

UpdateWindow [editableEntity entity]
  Tell RIDE to update the contents of a window. Typically used when a window switches from tracer mode to editor mode, or tracing up/down the stack.

UpdateDisplayName [string displayName]
  Sent when the display name changes.

WindowTypeChanged [int win, bool tracer]
  Tell RIDE to switch a window between debugger and editor modes.
</nowiki>

=Sent from either RIDE or interpreter=
 <nowiki>
SetLineAttributes [int win, lineAttributes attributes]
  Update the breakpoints, Trace points and monitors in an editor.

CloseWindow [int win]
  If sent from the interpreter tell RIDE to close an open editor window.
  If sent from RIDE request that a window be closed.
</nowiki>

=Sent from either a RIDE, Interpreter or Process Manager=
 <nowiki>
Identify [identity identity]
  Sent as part of the initial connection setup.

Disconnect [string msg]
  Sent to shut down the connection cleanly.
</nowiki>

=Sent from a RIDE or Interpreter to a Process Manager=
 <nowiki>
GetAvailableConnections [AvailableConnection[] connections]
  Request a list of availabe connections.

ConnectTo [int remoteId]
  Request a connection to a specific item (RIDE or interpreter).
</nowiki>

=Sent from a Process manager to a RIDE or Interpreter=
 <nowiki>
ConnectToSucceded [int remoteId, identity remoteIdentity, int protocolNumber]
  Tell the client that the ProcessManager is handing off the connection to a RIDE or Interpreter (as requested).
  The process manager knows the supported protocols so it can pick a supported protocol for the clients to switch to.
  Once this is received the client is no longer connected to the PM, but rather is connected to the specified process.

ConnectToFailed [int remoteId, string reason]
  Tell the client that the attempt to connect to a particular process failed.
</nowiki>

=Sent from anything to anything=
 <nowiki>
GetDetailedInformation [int[] remoteId] 
  If sent to a Process manager remoteID is a list of remote IDs returned by GetAvailableConnections. Otherwise it's
  an empty list

ReplyGetDetailedInformation [DetailedInformation[] information]
  Sent in reply to getDetailedInformation
</nowiki>

=Extended types=
This section describes types used in the messages that extend the simple types used in the message encoding.



 <nowiki>

Note: Check if these are only used in one place. If so flatten out to properties of the message its used in
Note: If an enumeration is sent with any undefined value it is considered invalid.

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
                                                                //   NN: RIDE2 ignores colours, subOffset, subSize, tid, and tidName

lineAttributes => lineAttribute[int[] stop, int[] monitor, int[] trace] // vector of lines with the given attribute. If a line is not mentioned it
                                                                        // has no attributes
                                                                        //   NN: RIDE2 uses only "stop"

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
</nowiki>

=Extensions=
NN: We should add support for:
* value tips
    NB. Needs design with JD -- window content might have changed, the name might be context-dependent
    RIDE→Interpreter:  GetValueTip [int win, string line, int pos, int token]
    Interpreter→RIDE:  ValueTip [string tip, int token]
* <tt>⎕PFKEY</tt>
    ?
* <tt>⎕PW</tt> and <tt>AUTO_PW</tt>
    RIDE→Interpreter:  SetPW [int pw]
* programmatic access to "current object"
    RIDE→Interpreter:  SetCurrentObject [string s]
* workspace explorer
    NB. use ids (of type "Something") instead of string[] path
    RIDE→Interpreter:  TreeGetNameList [Something nodeId]
    Interpreter→RIDE:  TreeNameList [Something nodeId, NodeInfo[] children]
                            NodeInfo [
                                Something id
                                int type
                                string name
                            ]
    Interpreter→RIDE:  TreeOpenEditor [Something nodeId]
* compiler information
    ?
* yes/no dialogs
    Interpreter→RIDE:  ShowDialog [string title, string text, int type, string[] options, int token]
                            type: one of 1=info 2=warning 3=err ...
    RIDE→Interpreter:  DialogResult [int index, int token]

    2015-12-15 NN: This is now supported except that "type" is ignored.
      When the user closes the dialog without choosing an option, RIDE responds with index:-1
* list of valid I-beams and their descriptions
    ?
* <tt>ShowStack</tt> and <tt>ShowThreads</tt>
* drop workspace in RIDE
* heartbeat

{{ProjectNavbox}}
