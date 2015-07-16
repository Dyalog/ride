// set-ime.exe is a utility that sets the input method locale for a particular process or its parent.
// To recompile it: %WINDIR%\Microsoft.NET\Framework\v%LATEST_DOTNET_VERSION%\csc.exe set-ime.cs
// To enable Dyalog's locale: set-ime.exe %PID% E0990409

using System;
using System.Diagnostics;
using System.Collections.Generic;
using System.Runtime.InteropServices;

class C {
  const uint WM_INPUTLANGCHANGEREQUEST = 0x0050;
  const int  KLF_ACTIVATE = 1;

  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] static extern bool PostMessage(IntPtr hhwnd, uint msg, IntPtr wparam, IntPtr lparam);
  [DllImport("user32.dll")] static extern IntPtr LoadKeyboardLayout(string pwszKLID, uint Flags);
  [DllImport("user32.dll")] static extern bool EnumThreadWindows(int dwThreadId, EnumThreadDelegate lpfn, IntPtr lParam);
  delegate bool EnumThreadDelegate(IntPtr hWnd, IntPtr lParam);

  static IntPtr getWindowByPID(int pid) {
    var handles = new List<IntPtr>();
    foreach (ProcessThread thread in Process.GetProcessById(pid).Threads) {
      EnumThreadWindows(thread.Id, (hWnd, lParam) => {handles.Add(hWnd); return true;}, IntPtr.Zero);
    }
    return handles.Count > 0 ? handles[0] : IntPtr.Zero;
  }

  private static string FindIndexedProcessName(int pid) {
    var processName = Process.GetProcessById(pid).ProcessName;
    var processesByName = Process.GetProcessesByName(processName);
    string processIndexdName = null;
    for (var index = 0; index < processesByName.Length; index++) {
      processIndexdName = index == 0 ? processName : processName + "#" + index;
      var processId = new PerformanceCounter("Process", "ID Process", processIndexdName);
      if ((int) processId.NextValue() == pid) {
        return processIndexdName;
      }
    }
    return processIndexdName;
  }

  private static Process FindPidFromIndexedProcessName(string indexedProcessName) {
    var parentId = new PerformanceCounter("Process", "Creating Process ID", indexedProcessName);
    return Process.GetProcessById((int) parentId.NextValue());
  }

  public static Process Parent(Process process) {
    return FindPidFromIndexedProcessName(FindIndexedProcessName(process.Id));
  }

  static int Main(string[] args) {
    if (args.Length != 2 || args[1].Length != 8) { Console.WriteLine("usage: set-ime PID LOCALE_CODE"); return 1; }
    int pid = int.Parse(args[0]);
    string lc = args[1]; // locale code
    var w = getWindowByPID(pid);
    if (w == IntPtr.Zero) { w = getWindowByPID(Parent(Process.GetProcessById(pid)).id); }
    PostMessage(w, WM_INPUTLANGCHANGEREQUEST, IntPtr.Zero, LoadKeyboardLayout(lc, KLF_ACTIVATE));
    return 0;
  }
}
