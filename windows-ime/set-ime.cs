using System;
using System.Runtime.InteropServices;

class C {
  const uint WM_INPUTLANGCHANGEREQUEST = 0x0050;
  const int  KLF_ACTIVATE = 1;

  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] static extern bool PostMessage(IntPtr hhwnd, uint msg, IntPtr wparam, IntPtr lparam);
  [DllImport("user32.dll")] static extern IntPtr LoadKeyboardLayout(string pwszKLID, uint Flags);

  static int Main(string[] args) {
    if (args.Length != 1 || args[0].Length != 8) { Console.WriteLine("usage: set-ime LOCALE_CODE"); return 1; }
    PostMessage(GetForegroundWindow(), WM_INPUTLANGCHANGEREQUEST, IntPtr.Zero, LoadKeyboardLayout(args[0], KLF_ACTIVATE));
    return 0;
  }
}
