(function(win){

  var Config = {};
  Config.help = "?";
  Config.helpTitle = "Klávesové zkratky";
  Config.helpHref = "https://dokumenty.internetguru.cz/zkratky";
  Config.appDisable = "×";
  Config.appDisableTitle = "Deaktivovat CodeMirror (F4)";
  Config.appEnable = "Aktivovat CodeMirror";
  Config.appEnableTitle = "F4";
  Config.format = "Formátovat";
  Config.formatTitle = "Ctrl+Shift+F";
  Config.fullscreenDisable = "▫";
  Config.fullscreenDisableTitle = "Obnovit (Shift+F11)";
  Config.fullscreenEnable = "□";
  Config.fullScreenEnableTitle = "Maximalizovat (Shift+F11)";
  Config.find = "Najít";
  Config.findTitle = "Ctrl+F";
  Config.replace = "Nahradit";
  Config.replaceTitle = "Ctrl+H";
  Config.space = "Regexp ze souboru";
  Config.spaceTitle = "";
  Config.appName = "CodeMirror";

  var SyntaxCodeMirror = function() {
    // private
    var
    cm = null,
    scm = null,
    textarea = null,
    visible = true,
    active = true,
    activateUl = null,
    appendButton = function(text, ul, href) {
      var li = document.createElement("li");
      ul.appendChild(li);
      var b;
      if(typeof href == "undefined") {
        b = document.createElement("button");
      } else {
        b = document.createElement("a");
        b.href = href;
      }
      li.appendChild(b);
      b.type = "button";
      b.textContent = text;
      return b;
    },
    toggleApp = function() {
      if(cm.getOption("fullScreen")) toggleFullScreen(cm);
      if(active) {
        cm.toTextArea();
        activateUl.style.display = "";
        textarea.focus();
      } else {
        _init();
        activateUl.style.display = "none";
        cm.focus();
      }
      active = !active;
    },
    autoFormatSelection = function(c) {
      var range = c.execCommand("getSelectedRange");
      c.autoFormatRange(range.from, range.to);
    },
    autoIndentSelection = function(c) {
      var range = c.execCommand("getSelectedRange");
      c.autoIndentRange(range.from, range.to);
    },
    showRegexpFile = function(c) {
      var text = c.getValue();
      var dialogTempl = 'File path, eg. /files/reg.txt: <input type="text" style="width: 10em" class="CodeMirror-search-field"/>';
      c.openDialog(dialogTempl, function (filePath) {
	var request = new XMLHttpRequest();
        request.open('GET', filePath);
        request.responseType = 'text';
        request.onreadystatechange = function() {
          if (request.readyState !== XMLHttpRequest.DONE) {
            return;
          }
          if (request.status != 200 && request.status != 301) {
            c.openNotification("Failed to get file " + filePath + " [" + request.status + "]", {duration: 3000});
            return;
          }
          var data = request.response;
          data = data.replace(/(<([^>]+)>)/ig,"");
          var lines = data.split("\n");
          var results = [];
          for(var i = 0; i < lines.length; i++){
            var line = lines[i].trim();  
            if(!line.startsWith("s/")) {
              continue;
            }
            var parts = line.match(/^s\/(.+)\/(.+)\/(.+)/);
            var pattern = new RegExp(parts[1], parts[3]);
            text = text.replace(pattern, parts[2]);
          }
          c.setValue(text);
        };
        request.send();
      });
    }
    toggleFullScreen = function(c, off) {
      if(typeof off === "undefined") off = false;
      if(!active) return;
      if(c.getOption("fullScreen") || off) {
        c.setOption("fullScreen", false);
        fullScreenButton.textContent = Config.fullscreenEnable;
        fullScreenButton.title = Config.fullScreenEnableTitle;
      } else {
        c.setOption("fullScreen", true);
        fullScreenButton.textContent = Config.fullscreenDisable;
        fullScreenButton.title = Config.fullscreenDisableTitle;
      }
    },
    scrollWin = function(step) {
      var doc = document.documentElement;
      var top = (win.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
      var height = document.body.scrollHeight;
      var scrollTo = top + step;
      if(scrollTo < 0 || scrollTo > height ) return;
      win.scrollTo(0, scrollTo);
    },
    fireEvents = function() {
      win.onkeydown = function(e) {
        var key;
        var isShift;
        if (win.event) {
          key = win.event.keyCode;
          isShift = !!win.event.shiftKey; // typecast to boolean
          isCtrl = !!win.event.ctrlKey; // typecast to boolean
        } else {
          key = e.which;
          isShift = !!e.shiftKey;
          isCtrl = !!e.ctrlKey;
        }
        switch (key) {
          // F4
          case 115:
          toggleApp(cm);
          break;
          // Shift + F11
          case 122:
          if(isShift) {
            toggleFullScreen(cm);
            cm.focus();
            break;
          }
          // Tab, Shift+Tab
          case 9:
          toggleFullScreen(cm, true);
          default: return true;
        }
        return false;
      }
    },
    initEditor = function() {
      cm = CodeMirror.fromTextArea(textarea, {
        tabMode: "default",
        keyMap:"sublime",
        theme:"tomorrow-night-eighties",
        lineNumbers: true,
        mode: textarea.classList.item(1),
        width:"100%",
        lineWrapping: true,
        matchTags: { bothTags: true },
        //tabSize: 2,
        styleActiveLine: true,
        styleSelectedText: true,
        autoCloseTags: {
          whenClosing: true,
          whenOpening: false
        },
        extraKeys: CodeMirror.normalizeKeyMap({
          "Tab": false,
          "Shift-Tab": false,
          "Ctrl-Up": function(c) {
            if(c.getOption("fullScreen"))
              c.execCommand("scrollLineUp");
            else scrollWin(-32);
          },
          "Ctrl-Down": function(c) {
            if(c.getOption("fullScreen"))
              c.execCommand("scrollLineDown");
            else scrollWin(32);
          },
          "Ctrl--": "toggleComment",
          "Ctrl-G": "jumpToLine",
          "Ctrl-E": "deleteLine",
          "End": "goLineRight",
          "Home": "goLineLeftSmart",
          "Ctrl-Shift-F": function(c) { autoFormatSelection(c); },
          "Ctrl-Shift-I": function(c) { autoIndentSelection(c); },
          "F3": function(c) { c.execCommand("findNext"); },
          "Shift-F3": function(c) { c.execCommand("findPrev"); },
        })
      });
    },
    initActivateButton = function() {
      activateUl = document.createElement("ul");
      var activateButton = appendButton(Config.appEnable, activateUl);
      activateButton.title = Config.appEnableTitle;
      textarea.parentNode.insertBefore(activateUl, textarea);
      activateUl.style.display = "none";
      activateButton.addEventListener("click", toggleApp, false);
    },
    initUserMenu = function() {
      var ul = document.createElement("ul");
      ul.className="codemirror-user-controll";

      findButton = appendButton(Config.find, ul);
      findButton.title = Config.findTitle;
      replaceButton = appendButton(Config.replace, ul);
      replaceButton.title = Config.replaceTitle;
      formatButton = appendButton(Config.format, ul);
      formatButton.title = Config.formatTitle;
      spaceButton = appendButton(Config.space, ul);
      spaceButton.title = Config.spaceTitle;
      helpButton = appendButton(Config.help, ul, Config.helpHref);
      helpButton.title = Config.helpTitle;
      fullScreenButton = appendButton(Config.fullscreenEnable, ul);
      fullScreenButton.title = Config.fullScreenEnableTitle;
      disableButton = appendButton(Config.appDisable, ul);
      disableButton.title = Config.appDisableTitle;
      textarea.nextSibling.insertBefore(ul, textarea.nextSibling.firstChild);

      findButton.onclick = function() {
        CodeMirror.commands.find(cm);
      }
      replaceButton.onclick = function() {
        CodeMirror.commands.replace(cm);
      }
      fullScreenButton.onclick = function() {
        toggleFullScreen(cm);
      }
      formatButton.onclick = function() {
        autoFormatSelection(cm);
      }
      spaceButton.onclick = function() {
        showRegexpFile(cm);
      }
      disableButton.onclick = function() {
        toggleApp(cm);
      }
    },
    _init = function() {
      initEditor();
      initUserMenu();
    }
    // public
    return {
      init : function(newTextarea, newScm) {
        // initCfg(cfg);
        scm = newScm;
        textarea = newTextarea;
        _init();
        initActivateButton();
        fireEvents();
      },
      getInstance : function() {
        return cm;
      }
    }
  };

  var textareas = document.querySelectorAll('textarea.codemirror');
  var cm = new SyntaxCodeMirror();
  cm.init(textareas[0], cm);
  win.CodeMirrorInstance = cm.getInstance();

})(window);
