param($installPath, $toolsPath, $package, $project)

$sqliteReference = $project.Object.References.AddSDK("SQLite for Windows Phone", "SQLite.WP80, version=3.8.3.1")

Write-Host "Successfully added a reference to the extension SDK SQLite for Windows Phone."
Write-Host "Please, verify that the extension SDK SQLite for Windows Phone v3.8.3.1, from the SQLite.org site (http://www.sqlite.org/2014/sqlite-wp80-winrt-3080301.vsix), has been properly installed."