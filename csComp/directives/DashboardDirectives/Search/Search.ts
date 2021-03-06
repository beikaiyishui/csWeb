module Search {
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
      * Directive to display the available map layers.
      */
    myModule.directive('searchHeader', [
        '$window', '$compile',
        function($window, $compile): ng.IDirective {
            return {
                terminal: false, // do not compile any other internal directives
                restrict: 'E', // E = elements, other options are A=attributes and C=classes
                scope: {
                    container: '='
                }, // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                //template: html, // I use gulp automatian to compile the FeatureProperties.tpl.html to a simple TS file, FeatureProperties.tpl.ts, which contains the html as string. The advantage is that you can use HTML intellisence in the html file.
                templateUrl: 'directives/DashboardDirectives/Search/Search.tpl.html',
                link: (scope: any, element, attrs) => {                    
                 
                },
                replace: false,
                transclude: true, // Add elements and attributes to the template
                controller: SearchCtrl
            }
        }
    ]);

}
