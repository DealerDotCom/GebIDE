/*global FBL */
FBL.ns(function () {
	with (FBL) {
		var panelName = "firefinder",
			regExpIsXPath = /^\//,
			regExpClass = /\s?firefinder\-match(\-hover)?/g,
			regExpHoverClass = /firefinder\-match\-hover/,
			regExpInitialViewClass = /initial\-view/,
			regExpCollapsedClass = /collapsed/,
			regExpInspectElementClass = /firefinder\-inspect\-element/,
			regExpFriendlyFireClass = /firefinder\-friendly\-fire\-this/,
			regExpFriendlyFireURLClass = /firefinder\-friendly\-fire\-url/,
			regExpFriendlyFireCopyURLClass = /firefinder\-friendly\-fire\-copy\-url/,
			regExpSpaceFix = /^\s+|\s+$/g,
			regExpEmptyClass = /\sclass=(""|'')/g,
			regExpInnerCodeClass = /inner\-code\-container/,
			regExpSlashEscape = /\//g,
			regExpCharacters = /["<>\r\n\t]/g,
			regExpSingleCloseElements = /img|input/,
			matchReplace = function (match) {
				var retVal = "";
				if (match === '"') {
					retVal = "&quot;";
				}
				else if (match === "<") {
					retVal = "&lt;";
				}
				else if (match === ">") {
					retVal = "&gt;";
				}
				return retVal;
			},
			inputField = null,
			results = null,
			resultsHeader = null,
			statesFirefinder = {
			},
			strBundle = document.getElementById("strings"),
			translations = {
				firefinderfindmatchingelements : strBundle.getString("firefinderfindmatchingelements"),
				firefindermatchingelements : strBundle.getString("firefindermatchingelements"),
				firefindernomatches : strBundle.getString("firefindernomatches"),
				firefinderfilter : strBundle.getString("firefinderfilter"),
				firefindersending : strBundle.getString("firefindersending"),
				firefindertimedout : strBundle.getString("firefindertimedout"),
				firefindercopy : strBundle.getString("firefindercopy"),
				firefinderinspect : strBundle.getString("firefinderinspect"),
				firefindercollapsematcheslist : strBundle.getString("firefindercollapsematcheslist"),
				firefinderstartautoselect : strBundle.getString("firefinderstartautoselect"),
				firefinderopenfriendlyfirepageautomatically : strBundle.getString("firefinderopenfriendlyfirepageautomatically")
			},  
			getTabIndex = function () {
				var browsers = FBL.getTabBrowser().browsers,
					tabIndex;
				for (var i=0, il=browsers.length; i<il; i++) {
					if(FBL.getTabBrowser().getBrowserAtIndex(i).contentWindow == content) {
						tabIndex = i;
						break;
					}
				}
				return tabIndex;
			},
			getFirefinderState = function () {
				var tabIndex = getTabIndex(),
					state = statesFirefinder[tabIndex];
				if (!state) {
					state = statesFirefinder[getTabIndex()] = {
						matchingElements : []
					};
				}	
				return state;	
			};
		
		Firebug.firefinderModel = extend(Firebug.Module, {
			baseContentAdded : false,
		    showPanel : function(browser, panel) {
				var isPanel = panel && panel.name === panelName, 
					firefinderButtons = browser.chrome.$("fbfirefinderButtons"),
					state = getFirefinderState(),
					startAutoSelect = Firebug.getPref(Firebug.prefDomain, "firefinder.startAutoSelect"),
					firefinderAutoSelectButton = document.getElementById("firefinderAutoSelectButton");
				collapse(firefinderButtons, !isPanel);
				if (isPanel) {
					if (startAutoSelect) {
						Firebug.firefinderModel.autoSelect(Firebug.currentContext, true);
					}
					if (firefinderAutoSelectButton) {
						firefinderAutoSelectButton.checked = (startAutoSelect || state.autoSelect)? true : false;
					}
				}
				else {
					Firebug.firefinderModel.turnOffAutoSelect(true);
				}
		    },
		
			addBaseContent : function (panelNode) {
				var baseContent = domplate({
						panelBase:
						DIV({
								id : "firefinder-container"
							},
							DIV({
									id: "firefinder-base-content"
								},
								H1(
									{},
									SPAN({
										},
										"Geb IDE"
									),
									SPAN({
											id : "firefinder-help-text"
										},
										" - " + translations.firefinderfindmatchingelements
									)
								),
								DIV(
									{
										id: "firefinder-search-box"
									},
									INPUT(
										{
											class : "firefinder-field",
											type : "text",
											onkeypress : function (evt) {
												if (evt.keyCode === 13) {
													Firebug.firefinderModel.run(Firebug.currentContext);
												}
											}
										}
									),
									INPUT(
										{
											id : "firefinder-css-button",
											type : "button",
											value : translations.firefinderfilter,
											onclick : function () {
												Firebug.firefinderModel.run(Firebug.currentContext);
											}
										}
									)
								)
							),
							DIV(
								{
									class : "firefinder-results-container initial-view"
								},
								H2({
										class : "firefinder-results-header"
									},
									translations.firefindermatchingelements
								),
								DIV(
									{
										class : "firefinder-results"
									},
									translations.nomatches
								)
							)
						)
					});
				baseContent.panelBase.replace({}, panelNode, baseContent);
			},
		
			addStyleSheet : function (doc) {
				var styleSheet = document.getElementById("firefinder-firebug-style");
				if (!styleSheet) {
					styleSheet = createStyleSheet(doc, "chrome://firefinder/skin/firebug.css");
					styleSheet.id = "firefinder-firebug-style";
					addStyleSheet(doc, styleSheet);
				}
			},
			
		   	run : function (context, element) {
				var panel = context.getPanel(panelName),
					panelNode = panel.panelNode,
					collapseMatchesList = Firebug.getPref(Firebug.prefDomain, "firefinder.collapseMatchesList"),
					inputField = dLite.elmsByClass("firefinder-field", "input", panelNode)[0],
					resultsContainer = dLite.elmsByClass("firefinder-results-container", "div", panelNode)[0],
					results = dLite.elmsByClass("firefinder-results", "div", panelNode)[0],
					resultsHeader = dLite.elmsByClass("firefinder-results-header", "h2", panelNode)[0],
					firefinderResultItems,
					
					// JavaScript and CSS to add to the web browser content
					cssApplied = content.document.getElementById("firefinder-css"),
					head,
					script,
					css,
					
					// Parse HTML elements
					parse = function (elements) {
						// CSS/XPath to filter by
						var filterExpression = inputField.value,
							XPath = regExpIsXPath.test(filterExpression),
							resultItem = "",
							state = Firebug.firefinderModel.clear(context),
							matchingElements = elements;
						
						// Find matching elements
						// if (typeof element !== "undefined") {
						//                            matchingElements = [element];
						//                        }
						//                        else if (XPath) {
						//                            matchingElements = [];
						//                            var xPathNodes = content.document.evaluate(filterExpression, content.document, ((content.document.documentElement.namespaceURI === ns.xhtml)? "xhtml:" : null), 0, null), node;
						//                            while ((node = xPathNodes.iterateNext())) {
						//                                matchingElements.push(node);
						//                            }
						//                        }
						//                        else {
						//                            matchingElements = new XPCNativeWrapper(content).document.querySelectorAll(filterExpression.replace(regExpSlashEscape, "\\\/"));
						//                        }
						
						// Add class to matching elements and clone them to the results container
						if (matchingElements.length > 0) {
							for (var j=0, jl=matchingElements.length, elm, nodeNameValue, nodeNameCode, k, attr; j<jl; j++) {
								elm = matchingElements[j];
								nodeNameValue = elm.nodeName.toLowerCase();
								nodeNameCode = "<span class='node-name'>" + nodeNameValue + "</span>";
								
								resultItem += "<div class='firefinder-result-item" + ((j % 2 === 0)? " odd" : "") + "'";
								resultItem += " ref='" + j + "'>";
								resultItem += "<div class='firefinder-inspect-element'>" + translations.firefinderinspect + "</div>";
								//resultItem += "<div class='firefinder-friendly-fire-this'>FriendlyFire</div>";
								resultItem += "&lt" + nodeNameCode;
								for (k=0, kl=elm.attributes.length; k<kl; k++) {
									attr = elm.attributes[k];
									resultItem += " " + attr.name + "=&quot;<span class='attribute-value'>" + attr.value + "</span>&quot;";
								};
								resultItem += "&gt;";
								
								if (elm.textContent.length > 0) {
								resultItem += "<div class='inner-code-container'>" + elm.textContent.replace(regExpCharacters, matchReplace) + "</div>";
								}
								if (!regExpSingleCloseElements.test(nodeNameValue)) {
									resultItem += "<div class='end-tag'>&lt;/" + nodeNameCode + "&gt;</div>";
								}
								resultItem += "</div>";
								
								elm.className += ((elm.className.length > 0)? " " : "") + "firefinder-match";
							}
						}
						else {
							resultItem = translations.firefindernomatches;
						}
						
						state.matchingElements = matchingElements;
						
						// Set results content
						results.innerHTML = resultItem;
						
						firefinderResultItems = dLite.elmsByClass("firefinder-result-item", "div", results);
						for (var l=0, ll=firefinderResultItems.length, matchingElm; l<ll; l++) {
							elm = firefinderResultItems[l];
							if (elm.getAttribute("ref")) {
								elm.addEventListener("mouseover", function (evt) {
									state.matchingElements[this.getAttribute("ref")].className += " firefinder-match-hover";
								}, false);
							
								elm.addEventListener("mouseout", function (evt) {
									matchingElm = state.matchingElements[this.getAttribute("ref")];
									matchingElm.className = matchingElm.className.replace(regExpHoverClass, "").replace(regExpSpaceFix, "");
								}, false);
								
								elm.addEventListener("click", function (evt) {
									var targetClassName = evt.target.className;
									if (regExpInspectElementClass.test(targetClassName)) {
										matchingElm = state.matchingElements[this.getAttribute("ref")];
										matchingElm.className = matchingElm.className.replace(regExpClass, "").replace(regExpSpaceFix, "");
										Firebug.toggleBar(true, "html");
										Firebug.chrome.select(matchingElm, "html");
									}
									else if (regExpFriendlyFireURLClass.test(targetClassName)) {
										FBL.getTabBrowser().selectedTab = FBL.getTabBrowser().addTab(evt.target.textContent);
									}
									else if (regExpFriendlyFireCopyURLClass.test(targetClassName)) {
										// Copy to clipboard code taken from/inspired by https://developer.mozilla.org/en/Using_the_Clipboard
										var friendlyFireURL = evt.target.getAttribute("url"),
											textUnicode = friendlyFireURL,
											textHtml = ("<a href=\"" + friendlyFireURL + "\">" + friendlyFireURL + "</a>"),
											str = Components.classes["@mozilla.org/supports-string;1"].												                       createInstance(Components.interfaces.nsISupportsString);  
										if (!str) {
											alert("Copying failed");
											return false;
										}
										str.data = textUnicode;

										var htmlstring = Components.classes["@mozilla.org/supports-string;1"].												                       createInstance(Components.interfaces.nsISupportsString);  
										if (!htmlstring) {
											alert("Copying failed");
											return false;
										}
										htmlstring.data = textHtml;
										
										var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);  
										if (!trans) {
											alert("Copying failed");
											return false;
										}

										trans.addDataFlavor("text/unicode");  
										trans.setTransferData("text/unicode", str, textUnicode.length * 2); // *2 because it's unicode  

										trans.addDataFlavor("text/html");  
										trans.setTransferData("text/html", htmlstring, textHtml.length * 2); // *2 because it's unicode   

										var clipboard = Components.classes["@mozilla.org/widget/clipboard;1"].												                       getService(Components.interfaces.nsIClipboard);  
										if (!clipboard) {
											alert("Copying failed");
											return false;
										}

										clipboard.setData(trans, null, Components.interfaces.nsIClipboard.kGlobalClipboard);  
										return true;
									}
									else if (regExpFriendlyFireClass.test(targetClassName)) {
										matchingElm = state.matchingElements[this.getAttribute("ref")];
										var matchingElmInList = evt.target,
											fakeDivForGettingInnerHTML = content.document.createElement("div"),
											nodeCode;
										fakeDivForGettingInnerHTML.appendChild(matchingElm.cloneNode(true));
										nodeCode = fakeDivForGettingInnerHTML.innerHTML;
									
										var XMLHttp = new XMLHttpRequest(),
											failedText = "Failed. Click to try again",
											requestTimer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
										XMLHttp.open("POST", "http://jsbin.com/save", true);

										// These two are vital
										XMLHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
										XMLHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

										// This line doesn't seem to matter, although it should state number of sent params below in the send method
										XMLHttp.setRequestHeader("Content-length", 2);

										// This line seems superfluous
										XMLHttp.setRequestHeader("Connection", "close");

										XMLHttp.onreadystatechange = function () {
											if (XMLHttp.readyState === 4) {
												requestTimer.cancel();
												if (XMLHttp.status === 200) {
													var response = XMLHttp.responseText + "/edit#html";
													matchingElmInList.className += " firefinder-friendly-fire-fired";
													matchingElmInList.innerHTML = '<span class="firefinder-friendly-fire-url">' + response + '</span>(<span class="firefinder-friendly-fire-copy-url" url="' + response + '">' + translations.firefindercopy + '</span>)';
													if (Firebug.getPref(Firebug.prefDomain, "firefinder.openFriendlyFirePageAutomatically")) {
														FBL.getTabBrowser().selectedTab = FBL.getTabBrowser().addTab(response);
													}
												}
												else {
													matchingElmInList.innerHTML = failedText;
												}
											}
										};
										XMLHttp.onerror = function () {
											matchingElmInList.innerHTML = failedText;
										};
										matchingElmInList.innerHTML = translations.firefindersending + "...";
										XMLHttp.send("html=" + encodeURIComponent(nodeCode.replace(regExpClass, "").replace(regExpSpaceFix, "").replace(regExpEmptyClass, "")) + "&format=plain");
										requestTimer.cancel();
										requestTimer.initWithCallback(function () {
											XMLHttp.abort();
											matchingElmInList.innerHTML = translations.firefindertimedout;
										}, 3000, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
									}
									else if (!regExpInnerCodeClass.test(evt.target.className)) {
										if (regExpCollapsedClass.test(this.className)) {
											this.className = this.className.replace(regExpCollapsedClass, "").replace(regExpSpaceFix, "");
										}
										else {
											this.className += " collapsed";
										}
									}
								}, false);
							}
							if (collapseMatchesList) {
								elm.className += " collapsed";
							}	
						}
						resultsHeader.innerHTML = translations.firefindermatchingelements + ": " + matchingElements.length;
						resultsContainer.className = resultsContainer.className.replace(regExpInitialViewClass, "").replace(regExpSpaceFix, "");
					};
															
					if (!cssApplied) {
						head = content.document.getElementsByTagName("head")[0];						
						css = new XPCNativeWrapper(content).document.createElement("link");
						css.id = "firefinder-css";
						css.type = "text/css";
						css.rel = "stylesheet";
						css.href = "chrome://firefinder/content/browser.css";
						head.appendChild(css);
					}
					var jso=window.content.document.defaultView.wrappedJSObject;
                    jso.showGebResults = parse;
                    jso.GEB = inputField.value
		    },
		
			show : function (context) {
				// Forces Firebug to be shown, even if it's off
				Firebug.toggleBar(true);
				Firebug.toggleBar(true, panelName);
				if (Firebug.currentContext) {
					var panel = Firebug.currentContext.getPanel(panelName);
					var inputField = dLite.elmsByClass("firefinder-field", "input", panel.panelNode)[0];
					inputField.select();
					inputField.focus();
				}
			},
		
			hide : function (context) {
				Firebug.toggleBar(false, panelName);
		    },
		
			autoSelect : function (context, forceOn) {
				var state = getFirefinderState(),
					firefinderAutoSelectButton = document.getElementById("firefinderAutoSelectButton");
				if (forceOn || !state.autoSelect) {
					state.autoSelect = true;
					content.document.addEventListener("mouseover", Firebug.firefinderModel.selectCurrentElm, true);
					content.document.addEventListener("click", Firebug.firefinderModel.selectCurrentElm, true);
					firefinderAutoSelectButton.checked = true;
				}
				else {
					Firebug.firefinderModel.turnOffAutoSelect();
					firefinderAutoSelectButton.checked = false;
				}
			},
			
			selectCurrentElm : function (evt) {
				Firebug.firefinderModel.run(Firebug.currentContext, evt.target);
				if (evt.type === "click") {
					evt.preventDefault();
					Firebug.firefinderModel.turnOffAutoSelect(true);
				}
			},
			
			turnOffAutoSelect : function (keepSelectedElm) {
				var state = getFirefinderState();
				state.autoSelect = false;
				content.document.removeEventListener("mouseover", Firebug.firefinderModel.selectCurrentElm, true);
				content.document.removeEventListener("click", Firebug.firefinderModel.selectCurrentElm, true);
				document.getElementById("firefinderAutoSelectButton").checked = false;
				if (!keepSelectedElm) {
					Firebug.firefinderModel.clear(Firebug.currentContext);
				}
			},
		
			clear : function (context) {
				var panel = Firebug.currentContext.getPanel(panelName),
					panelNode = panel.panelNode,
					state = getFirefinderState(),
					resultsContainer = dLite.elmsByClass("firefinder-results-container", "div", panelNode)[0],
					matchingElements;
					
				resultsContainer.className = "firefinder-results-container initial-view";
				matchingElements = state.matchingElements;
				
				// Clear previosuly matched elements' CSS classes	
				for (var i=0, il=matchingElements.length, elm; i<il; i++) {
					elm = matchingElements[i];
					elm.className = elm.className.replace(regExpClass, "").replace(regExpSpaceFix, "");
					if (elm.className.length === 0) {
						elm.removeAttribute("class");
					}
				}				
				return state;		
			}
		});
			
		
		function firefinderPanel () {
			
		}
		firefinderPanel.prototype = extend(Firebug.Panel, {
			name : panelName,
			title : "Geb IDE",
			initialize : function () {
				Firebug.Panel.initialize.apply(this, arguments);
				Firebug.firefinderModel.addStyleSheet(this.document);
				Firebug.firefinderModel.addBaseContent(this.panelNode);
			},
			
			getOptionsMenuItems : function () {				
				return [
					this.optionsMenuItem(translations.firefindercollapsematcheslist, "firefinder.collapseMatchesList"),
					//this.optionsMenuItem(translations.firefinderstartautoselect, "firefinder.startAutoSelect"),
					this.optionsMenuItem(translations.firefinderopenfriendlyfirepageautomatically, "firefinder.openFriendlyFirePageAutomatically"),
				];
			},
			
			optionsMenuItem : function  (text, option) {
				var pref = Firebug.getPref(Firebug.prefDomain, option);
				return {
					label : text,
					type : "checkbox",
					checked : pref,
					command : bindFixed(Firebug.setPref, this, Firebug.prefDomain, option, !pref)
				};
			}
		});
		
		Firebug.registerModule(Firebug.firefinderModel);
		Firebug.registerPanel(firefinderPanel);
	}
});
