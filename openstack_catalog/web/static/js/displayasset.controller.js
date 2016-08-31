(function() {
  'use strict';
  angular
    .module('AppCatalog')
    .controller('DisplayAssetController', DisplayAssetController);
  DisplayAssetController.$inject = ['$http', '$routeParams', 'UrlService'];
  function DisplayAssetController($http, $routeParams, UrlService) {
    var vm = this;
    vm.Approve = Approve;
    vm.Deactivate = Deactivate;
    $http
      .get(UrlService.getApiUrl(['artifacts', $routeParams.type, $routeParams.id], {}))
      .then(function(response) {
        vm.item = response.data;
        vm.type = $routeParams.type;
      });
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
