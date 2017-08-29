# The Ride 4.0 Project
Version 2, Dated September 21st, 2016

## Introduction
RIDE 4, being the third release of the "new generation" RIDE, will hopefully bring the RIDE to a level of maturity where people no longer think of it as a new and somewhat experimental IDE. The last significant missing features (like threading menu items) should be added, and any remaining unintended differences with the ODE should be ironed out, and stability should be improved to the point where people should feel comfortable using RIDE even under Windows (with the possible exception of people who are addicted to the "window modes" that the ODE supports).
Note that RIDE 4.0 needs to be upwards compatible with Dyalog v15.0, so there is no reason to link the release date for RIDE 4.0 directly to that of Dyalog v16.0. It is still natural to think of them as being related.
### Bug Fixing
We need to look at Kai's most important concerns and sort them into short-term bugs to be fixed in RIDE 3, bugs to fix at the start of RIDE 4 (and either back-port them or have Kai as an "alpha" tester of RIDE 4), and "new features for RIDE 4".
### Research into Android and iOS
We should do research into how we might be able to deliver "native" (as opposed to browser-based) RIDE on Android and iOS. We should test "native" iOS and Android browsers to see whether they support the browser-based version, and how it reacts to small form factors.
## Major Features
Features that define Ride 4.0.

### 0. Upwards Compatibility
As mentioned in the introduction: Unlike RIDE 3, which required the use of Dyalog v15.0, RIDE 4 needs to be compatible with both v15.0 and v16.0 (and RIDE 3 needs to work with v16.0). Functionality which is not available in some combination of front- and back-end needs to fail gracefully.
Our policy for RIDE support will mirror support for the interpreter: we will support the last 3 releases. Thus, support for RIDE 2.0 needs to continue for another cycle.
### 1. UI Design
We will get involved with Mike and other Optima folks early on in the process (right after the UM) to look at really trying to jazz things up. The connection screen needs to be redesigned.
### 2. Raspberry Pi Version
The Raspberry Pi version should be tested and documented.
### 3. "Zero Footprint" Operation
Ability to launch RIDE from a browser by pointing to an interpreter which embeds a CONGA library running enough of a web server to serve up the source code. The "ZF" version will mostly have the same functionality as the Electron version, but a few things will be different:

 1. The "connection" menu will be absent
 2. Configuration will be contained in a target-domain specific local storage within the browser. A special mechanism will be required to store/load configuration data.
 3. Demos cannot be loaded from the file system unless the APL system can serve them up.

### 4. Establish ssh tunnel and connect to existing APL process
Jason has identified the ability to create an ssh tunnel and then connect to (or listen for) an existing APL interpreter as an important use case for system administrators.
We may want to consider separating connection features into a separate module which could be worked on independently (but ideally still in Javascript). However, the addition of this feature now that we already have the ssh tunnel capability, doesn't seem to justify the work to do the separation at this point.
### 5. Formatting of Functions
Through the addition of new options to RIDE and/or ODE, there needs to be a mode in which it is possible to "reformat" source code in both systems and achieve the EXACT same results, to avoid glitches with source code management systems.
### 6. Search Functionality
Provide a mechanism to search the session.
WIBNI there was a way to Search / Replace within a function body or section (not the whole script).
### 7. APL Configuration Options
Make it possible to set the following APL options from the RIDE:

 - Single Trace Window
 - Pause on Error (from Threads menu)
 - Check whether anything else might be worthwhile

### 8. RIDE Configuration
Ensure smooth functionality when multiple RIDEs are sharing the same configuration file (atomic updates, at end of session, or when new connections are defined).
### 9. Missing ODE Functionality
Add support for:

 - Show Stack
 - All items on the Threads Menu
 - Windows|Close all Windows?

### 11. Proper AutoPW Support
Including Quote Quad and System Command Output. This is probably mostly interpreter side work, but is mentioned here as something we need to have focus on ensuring.
### 12. WIBNI Section

1. WIBNI `⎕PFKEY` worked, at least for simple cases. Kai reports that in addition to strings to enter, he would need support for the actions LL (Left Limit), RL (Right Limit) and ER (Enter).
2. Alex Foia's idea of a "variable inspector" is worth thinking about.
