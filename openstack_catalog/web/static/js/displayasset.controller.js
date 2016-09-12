(function() {
  'use strict';
  var knownTypes = ['images', 'tosca_templates', 'heat_templates', 'murano_packages'];
  var noCopyFields = {_all: ['visibility', 'status']};
  angular
    .module('AppCatalog')
    .controller('DisplayAssetController', DisplayAssetController);
  DisplayAssetController.$inject = ['$http', '$routeParams', 'UrlService',
                                    '$location', 'Api'];
  function DisplayAssetController($http, $routeParams, UrlService, $location, Api) {
    var vm = this;
    var deps = [];
    var dependencies = [];
    if (knownTypes.indexOf($routeParams.type) < 0) {
      $location.url('404');
    }
    vm.Approve = Approve;
    vm.Deactivate = Deactivate;
    vm.Copy = Copy;
    vm.dependencies = [];
    $http
      .get(UrlService.getApiUrl(['artifacts', $routeParams.type, $routeParams.id], {}))
      .then(function(response) {
        vm.item = response.data;
        vm.type = $routeParams.type;
        deps = response.data.depends;
        if (deps !== undefined) {
          deps = deps.slice();
        } else {
          deps = [];
        }
        loadDependencyNames();
      }, function(response) {
        if (response.status === 404) {
          $location.url('404');
        }
      });
    function loadDependencyNames() {
      if (deps.length > 0) {
        var dep = deps.pop();
        var bits = dep.split('/').slice(1);
        var url = UrlService.getApiUrl(bits, {});
        $http.get(url).then(function(response) {
          dependencies.push({name: response.data.name, type: bits[1], id: response.data.id});
        });
        loadDependencyNames();
      } else {
        vm.dependencies = dependencies;
      }
    }
    function Copy() {
      var artifact = {status: 'drafted'};
      Api.GetSchemas().then(function(schemas) {
        angular.forEach(vm.item, function(val, key) {
          var type = Api.GetFieldType($routeParams.type, key, schemas);
          var elementType = type.elementType || {};
          if (type.type === 'blob' || elementType.type === 'blob' || type.readOnly) {
            return;
          }
          if (noCopyFields._all.indexOf(key) !== -1) {
            return;
          }
          artifact[key] = val;
        });
        Api.CreateArtifact($routeParams.type, artifact).then(function(data) {
          console.log(data);
        });
      });
    }
    function Approve() {
      Patch([{
        op: 'replace',
        path: '/visibility',
        value: 'public'
      }]);
    }
    function Deactivate() {
      Patch([{
        op: 'replace',
        path: '/status',
        value: 'deactivated'
      }]);
    }
    function Patch(data) {
      $http.patch(UrlService.getApiUrl(['artifacts', vm.type, vm.item.id], {}), data)
      .then(function(response) {
        location.reload();
      }, function(response) {
        vm.error = response;
      });
    }
  }
})();
