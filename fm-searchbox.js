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
  .directive( "fmSearchbox", [
    "$timeout", function( $timeout ) {
      return {
        template : "<div>" +
                   " <button type='button' class='btn btn-default pull-left hideFocus actionButton' data-loading-text={{searchText}} data-toggle='tooltip' title={{actionTitle}} style='margin-right:2px'>" +
                   "   <i class='icon-search'></i>&nbsp;UID" +
                   " </button>" +
                   " <div class='input-group'>" +
                   "   <input type='text' class='form-control' placeholder={{placeholder}} ng-model=ngModel>" +
                   "   <span class='input-group-btn'>" +
                   "     <button type='button' class='btn btn-default hideFocus cancelButton' ng-click=\"ngModel=''\">" +
                   "       <span class='glyphicon glyphicon-remove'></span>" +
                   "     </button>" +
                   "   </span>" +
                   " </div>" +
                   "</div>",
        replace  : true,
        restrict : "E",
        scope    : {
          ngModel           : "=",
          placeholder       : "@",
          searchText        : "@",
          actionTitle       : "@",
          actionCancelTitle : "@",
          actionPlaceholder : "@"
        },
        link     : function postLink( scope, element, attributes, controller ) {

          scope.actionPending = false;

          var textbox = element.find( "input" );
          var actionButton = element.find( "button.actionButton" );
          var cancelButton = element.find( "button.cancelButton" );

          actionButton.hide();

          textbox.on( "focus", function() {
            actionButton.show();
          } );
          textbox.on( "blur", function() {
            $timeout(
              function() {
                // Hide the button if we're not searching right now.
                // Otherwise, we probably lost focus because the button was clicked.
                if( scope.actionPending != true ) {
                  actionButton.fadeOut();
                }
              }, 1000
            );
          } );

          actionButton.click( function() {
            waitForUid();
            var event = scope.$root.$broadcast( "LEARN_UID" );
            if( event.defaultPrevented ) {
              stopWaitingForUid();
            }
          } );

          cancelButton.click( function() {
            stopWaitingForUid();
          } );

          $timeout(
            function() {
              actionButton.tooltip( { placement : "top" } );
              actionButton.removeClass( "actionButton" );
              cancelButton.removeClass( "cancelButton" );
            }
          );

          function waitForUid() {
            actionButton.button( "loading" );
            actionButton.tooltip( "hide" );
            textbox.addClass( "uneditable-input" );
            cancelButton.tooltip( { placement : "top", title : scope.actionCancelTitle } );

            if( !element.originalPlaceholder ) element.originalPlaceholder = scope.placeholder;
            scope.actionPending = true;
            scope.placeholder = scope.actionPlaceholder;

            if( !(scope.$$phase || scope.$root.$$phase) ) scope.$apply();
          }

          function stopWaitingForUid() {
            actionButton.button( "reset" );
            textbox.removeClass( "uneditable-input" );
            cancelButton.tooltip( "destroy" );

            actionButton.hide();
            scope.actionPending = false;
            if( element.originalPlaceholder ) {
              scope.placeholder = element.originalPlaceholder;
              element.originalPlaceholder = null;
            }
            if( !(scope.$$phase || scope.$root.$$phase) ) scope.$apply();
          }

          scope.$watch( "actionPending", function( newValue, oldValue ) {
            if( newValue == true ) waitForUid();
            if( newValue == false ) stopWaitingForUid();
          } );

        }
      };
    } ] );