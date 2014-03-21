/**
 * Copyright (C) 2014, Oliver Salzburg
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 * Created: 2014-01-13 20:34
 *
 * @author Oliver Salzburg
 * @copyright Copyright (C) 2014, Oliver Salzburg, HARTWIG Communication & Events
 * @license http://opensource.org/licenses/mit-license.php MIT License
 */

"use strict";

// Declare fmComponents module if it doesn't exist.
try { angular.module( "fm.components" ); } catch( ignored ) { angular.module( "fm.components", [] ); }

angular.module( "fm.components" )
  .directive( "fmSearchboxButton",
              function() {
                return {
                  replace  : false,
                  restrict : "A",
                  link     : function postLink( scope, element, attributes, controller ) {
                    if( scope.actionButtons ) {
                      scope.actionButtons.push( element.get( 0 ) );
                    }

                    var action = attributes[ "action" ];
                    var blockInput = (attributes[ "blockInput" ]) ? true : false;
                    element.bind( "click", function() {
                      scope.triggerActionState( blockInput, attributes[ "placeholder" ], attributes[ "cancelTitle" ] );

                      var actionEvent = scope.$emit( action );
                      if( actionEvent.defaultPrevented ) {
                        scope.endActionState();
                      }
                    } );
                  }
                }
              } )

  .directive( "fmSearchboxButtonCancel",
              function() {
                return {
                  template : "<button type='button' class='btn btn-default hideFocus'>" +
                             "  <span class='glyphicon glyphicon-remove'></span>" +
                             "</button>",
                  replace  : true,
                  restrict : "E",
                  link     : function postLink( scope, element, attributes, controller ) {
                    scope.cancelButton = element.get( 0 );

                    element.on( "click", function() {
                      scope.ngModel = "";
                      scope.$emit( "cancelled" );
                    } );
                  }
                }
              } )

  .directive( "fmSearchbox", [
    "$compile", "$timeout", function( $compile, $timeout ) {
      return {
        replace  : false,
        restrict : "E",
        scope    : {
          ngModel           : "=",
          placeholder       : "@",
          searchText        : "@",
          actionCancelTitle : "@",
          actionPlaceholder : "@"
        },
        link     : function postLink( scope, element, attributes, controller ) {
          var header = "<div>";
          var footer = " <div class='input-group'>" +
                       "   <input type='text' class='form-control' placeholder={{placeholder}} ng-model=ngModel ng-disabled=!inputEnabled>" +
                       "   <span class='input-group-btn'>" +
                       "     <fm-searchbox-button-cancel />" +
                       "   </span>" +
                       " </div>" +
                       "</div>";

          var children = element.children();
          var childrenHTML = "";
          if( 0 != children.length ) {
            angular.forEach( children, function( child ) {
              childrenHTML += child.outerHTML;
            } );
          }
          // Construct the final template
          var template = header + childrenHTML + footer;

          // Create a new DOM element from the template.
          var newElement = angular.element( template );
          // Copy attributes from original element.
          var attributeSource = element[0].attributes;
          for( var attributeIndex = 0; attributeIndex < attributeSource.length; ++attributeIndex ) {
            newElement.attr( attributeSource.item( attributeIndex ).nodeName, attributeSource.item( attributeIndex ).nodeValue );
          }

          // Replace the original element with our new element.
          element.replaceWith( newElement );
          // Angularize the DOM element.
          // Prepare an array for searchbox buttons to register themselves into.
          scope.actionButtons = [];
          // Compilation will invoke all fmSearchboxButtons to be linked again.
          $compile( newElement )( scope );
          element = newElement;

          scope.actionPending = false;
          scope.inputEnabled = true;

          var textbox = element.find( "input" );
          var actionButtons = $( scope.actionButtons );
          var cancelButton = $( scope.cancelButton );

          actionButtons.hide();

          textbox.on( "focus", function() {
            actionButtons.show();
          } );
          textbox.on( "blur", function() {
            $timeout(
              function() {
                // Hide the button if we're not searching right now.
                // Otherwise, we probably lost focus because the button was clicked.
                if( scope.actionPending != true ) {
                  actionButtons.fadeOut();
                }
              }, 1000
            );
          } );

          scope.$on( "cancelled", function() {
            scope.endActionState();
            scope.$$phase || scope.$apply();
          } );

          $timeout(
            function() {
              actionButtons.tooltip( { placement : "bottom" } );
              actionButtons.removeClass( "actionButton" );
            }
          );

          scope.triggerActionState = function( isBlocking, placeholder, cancelTitle ) {
            scope.wasBlocking = isBlocking;

            actionButtons.fadeOut();
            actionButtons.tooltip( "hide" );
            if( isBlocking ) {
              scope.inputEnabled = false;
            }

            cancelButton.tooltip( "destroy" );
            if( cancelTitle ) {
              cancelButton.tooltip( { placement : "bottom", title : cancelTitle, container : "body" } );
            }

            if( !element.originalPlaceholder ) element.originalPlaceholder = scope.placeholder;
            scope.actionPending = true;
            if( placeholder ) {
              scope.placeholder = placeholder;
            }
          };

          scope.endActionState = function() {
            scope.wasBlocking = void(0);

            scope.inputEnabled = true;
            cancelButton.tooltip( "destroy" );

            actionButtons.hide();
            scope.actionPending = false;
            if( element.originalPlaceholder ) {
              scope.placeholder = element.originalPlaceholder;
              element.originalPlaceholder = null;
            }
          };

          scope.$watch( "actionPending", function( newValue, oldValue ) {
            if( newValue == true ) scope.triggerActionState( scope.wasBlocking );
            if( newValue == false ) scope.endActionState();
          } );

        }
      };
    } ] );