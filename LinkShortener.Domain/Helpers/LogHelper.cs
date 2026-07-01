using Serilog;

namespace LinkShortener.Domain.Helpers
{
    public static class LogHelper
    {
        private static bool SeriLogSetup = false;
        private static object _Lock = new object();

        private static void SetupSeriLogIfNotSetupAlready()
        {
            if (!SeriLogSetup)
            {
                lock (_Lock)
                {
                    if (!SeriLogSetup)
                    {
                        Log.Logger = new LoggerConfiguration()
                                    .MinimumLevel.Debug()
                                    .WriteTo.Console()
                                    .WriteTo.File("logs/log.log", retainedFileCountLimit: 30, rollingInterval: RollingInterval.Day)
                                    .CreateLogger();

                        SeriLogSetup = true;
                    }
                }
            }
        }

        public static void LogDebug(string message)
        {
            SetupSeriLogIfNotSetupAlready();

            Log.Debug(message);
        }

        public static void LogInformation(string message)
        {
            SetupSeriLogIfNotSetupAlready();

            Log.Information(message);
        }

        public static void LogWarning(string message)
        {
            SetupSeriLogIfNotSetupAlready();

            Log.Warning(message);
        }

        public static void LogError(string message)
        {
            SetupSeriLogIfNotSetupAlready();

            Log.Error(message);
        }

        public static void LogFatal(string message)
        {
            SetupSeriLogIfNotSetupAlready();

            Log.Fatal(message);
        }

        public static void LogVerbose(string message)
        {
            SetupSeriLogIfNotSetupAlready();

            Log.Verbose(message);
        }
    }
}