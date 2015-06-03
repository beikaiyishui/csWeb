module Filters {
    /**
      * Config
      */
    var moduleName = 'csComp';

    /**
      * Module
      */
    export var myModule;
    try {
        myModule = angular.module(moduleName);
    } catch (err) {
        // named module does not exist, so create one
        myModule = angular.module(moduleName, []);
    }

    /**
      * Directive to display a legend in a widget.
      */
    myModule.directive('txt2', [
        '$compile',
        function($compile) : ng.IDirective {
            return {
                terminal   : true,    // do not compile any other internal directives
                restrict   : 'E',     // E = elements, other options are A=attributes and C=classes
                scope      : {},      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                templateUrl : 'directives/Widgets/Filters/TextFilter.tpl.html',
                compile    : el => {    // I need to explicitly compile it in order to use interpolation like {{xxx}}
                    var fn = $compile(el);
                    //console.log('this is the compile function of legendDirective');
                    return scope => {
                        fn(scope);
                    };
                },
                replace      : true,    // Remove the directive from the DOM
                transclude   : true,    // Add elements and attributes to the template
                controller   : TextFilterCtrl
            }
        }
    ]).directive('barFilter', [
        '$compile',
        function($compile) : ng.IDirective {
            return {
                terminal   : true,    // do not compile any other internal directives
                restrict   : 'E',     // E = elements, other options are A=attributes and C=classes
                scope      : {},      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                templateUrl : 'directives/Widgets/Filters/BarFilter.tpl.html',
                compile    : el => {    // I need to explicitly compile it in order to use interpolation like {{xxx}}
                    var fn = $compile(el);
                    //console.log('this is the compile function of legendDirective');
                    return scope => {
                        fn(scope);
                    };
                },
                replace      : true,    // Remove the directive from the DOM
                transclude   : true,    // Add elements and attributes to the template
                controller   : BarFilterCtrl
            }
        }
    ])
    .directive('dateFilter', [
        '$compile',
        function($compile) : ng.IDirective {
            return {
                terminal   : true,    // do not compile any other internal directives
                restrict   : 'E',     // E = elements, other options are A=attributes and C=classes
                scope      : {},      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                templateUrl : 'directives/Widgets/Filters/DateFilter.tpl.html',
                compile    : el => {    // I need to explicitly compile it in order to use interpolation like {{xxx}}
                    var fn = $compile(el);
                    //console.log('this is the compile function of legendDirective');
                    return scope => {
                        fn(scope);
                    };
                },
                replace      : true,    // Remove the directive from the DOM
                transclude   : true,    // Add elements and attributes to the template
                controller   : DateFilterCtrl
            }
        }
    ]);
}