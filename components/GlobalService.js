dump("GlobalService.js\n");

const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');
Components.utils.import("resource://gre/modules/AddonManager.jsm");

const ObserverService = Cc['@mozilla.org/observer-service;1']
            .getService(Ci.nsIObserverService);

var WindowWatcher;
var WindowManager;

function GlobalService() {
}
GlobalService.prototype = {

    classDescription : 'XulmanGlobalService',
    contractID : '@myokoym.net/xulman/startup;1',
    classID : Components.ID('{4b0f0f54-9fa4-4f10-8271-ae7cff408724}'),

    _xpcom_categories : [
        { category : 'app-startup', service : true }, // -Firefox 3.6
        { category : 'command-line-handler', entry : 'm-xulman' }
    ],

    QueryInterface : XPCOMUtils.generateQI([
        Ci.nsIObserver,
        Ci.nsICommandLineHandler
    ]),

    get wrappedJSObject() {
        return this;
    },

    observe : function(aSubject, aTopic, aData)
    {
        switch (aTopic)
        {
            case 'app-startup':
                if (!this.listeningProfileAfterChange) {
                    ObserverService.addObserver(this, 'profile-after-change', false);
                    this.listeningProfileAfterChange = true;
                }
                return;

            case 'profile-after-change':
                if (this.listeningProfileAfterChange) {
                    ObserverService.removeObserver(this, 'profile-after-change');
                    this.listeningProfileAfterChange = false;
                }
                WindowWatcher = Cc['@mozilla.org/embedcomp/window-watcher;1']
                                .getService(Ci.nsIWindowWatcher);
                WindowManager = Cc['@mozilla.org/appshell/window-mediator;1']
                                .getService(Ci.nsIWindowMediator);
                Components.utils.import('resource://xulman-modules/lib/CLHHelper.jsm');
                ObserverService.addObserver(this, 'final-ui-startup', false);
                return;

            case 'final-ui-startup':
                ObserverService.removeObserver(this, 'final-ui-startup');
                this.init();
                return;
        }
    },

    init : function()
    {
    },

    /* nsICommandLineHandler */

    handle : function(aCommandLine)
    {
        dump("handle\n");
        var arg = {
            disable: CLHHelper.getStringValue('xulman-disable', aCommandLine),
            list: CLHHelper.getBooleanValue('xulman-list', aCommandLine)
        };

        if (arg.list) {
            aCommandLine.preventDefault = true;
            //arg.autoClose = true;
            //arg.autoQuit = !WindowManager.getMostRecentWindow(null);
            AddonManager.getAllAddons(function(addons) {
              dump(
                addons.filter(function(addon) {
                  return addon.type == "extension"
                }).map(function(addon) {
                  return addon.name + ": " + addon.id + ": " + addon.getResourceURI().spec
                }).join("\n")
              );
            });
            return;
        } else if (arg.disable) {
            dump(arg.disable + "\n");
            aCommandLine.preventDefault = true;
            AddonManager.getAddonByID(arg.disable, function(addon) {
              dump(addon.id);
              if (addon.isActive) addon.userDisabled = addon.isActive;
            });
            return;
        }
    },

    get helpInfo()
    {
        if (!this._helpInfo)
            this._helpInfo =CLHHelper.formatHelpInfo({
                'xulman-disable' : 'Disables an active add-on.',
                'xulman-list' : 'Shows installed add-on list.'
            });
        return this._helpInfo;
    },
    _helpInfo : null
};

var NSGetFactory = XPCOMUtils.generateNSGetFactory([GlobalService]);
