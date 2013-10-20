/**
 * Game class
 */

function Game() {};

/**
 * Init the game
 * @param {object} $scope
 * @param {object} infos
 */
Game.prototype.init = function($scope, $cookieStore, $http, $timeout) {
  this.$scope = $scope;
  this.$cookieStore = $cookieStore;
  this.$http = $http;
  this.$timeout = $timeout;

  // Detect first load
  this.loaded = false;

  // scopes INFOS
  this.scopes = {
    "total_enemy_pwr": 0,
    "total_xp": 0,
    "total_gils": 0,
    "rate_enemy_pwr": 0,
    "rate_xp": 0,
    "rate_gils": 0,
    "boss_defeated": false
  };
  this.zone = {
    "level": 1
  };
  this.characters = this.enemy = {};
};

Game.prototype.preload = function() {
  var self = this;
  var $http = this.$http;

  this.tmp = 0;
  var tmp_max = 2;

  if (!self.data) {
    self.data = {};
  }

  // WEAPONS
  $http.get('data/characters.json').success(function(data) {
    self.data.characters = data;

    self.tmp += 1;
    if (self.tmp == tmp_max) self.load();
  });

  // WEAPONS
  $http.get('data/weapons.json').success(function(data) {
    self.data.weapons = data;

    self.tmp += 1;
    if (self.tmp == tmp_max) self.load();
  });
};

/**
 * Load game infos : characters, enemy & zone
 * depending the zone level
 */
Game.prototype.load = function() {
  var self = this;
  var zone_level = this.zone.level;
  var $scope = this.$scope;
  var $http = this.$http;

  this.tmp = 0;
  var tmp_max = 4;

  // LINES
  $http.get('data/lines.json').success(function(data) {
    self.lines = data[zone_level];

    self.tmp += 1;
    if (self.tmp == tmp_max) self.begin();
  });

  // ZONE
  $http.get('data/zone.json').success(function(data) {
    $scope.zone = self.zone = data[zone_level];

    self.tmp += 1;
    if (self.tmp == tmp_max) self.begin();
  });

  // ENNEMIES
  $http.get('data/enemies.json').success(function(data) {
    var enemy, _data = {};
    for (var i in data[zone_level]) {
      enemy = new Enemy(self, data[zone_level][i]);
      if (i in self.enemy) {
        enemy.extends(self.enemy[i].data);
      } else {
        enemy.init();
      }
      _data[i] = enemy;
    }
    $scope.enemy = self.enemy = _data;

    self.tmp += 1;
    if (self.tmp == tmp_max) self.begin();
  });

  // CHARACTERS
  $http.get('data/characters_zone.json').success(function(data) {
    var character, _data = {};
    for (var i in data[zone_level]) {
      var ref = data[zone_level][i];
      character = new Character(self, self.data.characters[ref]);
      if (i in self.characters) {
        character.extends(self.characters[i].data);
      } else {
        character.init();
      }
      _data[i] = character;
    }
    $scope.characters = self.characters = _data;

    self.tmp += 1;
    if (self.tmp == tmp_max) self.begin();
  });
};

/**
 * Operations that begins after getting data
 */
Game.prototype.begin = function() {
  var $scope = this.$scope;
  var $cookieStore = this.$cookieStore;
  var $timeout = this.$timeout;

  // Data from save
  if (!this.loaded) {
    this.loaded = true;
    var save = $cookieStore.get('game');
    if (save) {
      this.extends(save);
    }
  } else {
    // Detecting new zone level
    this.enemy = {};
  }

  // SCOPES
  for (var i in this.scopes) {
    $scope[i] = this.scopes[i];
  }

  this.refresh();
  this.run();
};

/**
 * Extends the properties with new ones
 * @param  {object} infos
 */
Game.prototype.extends = function(save) {
  var self = this;
  for (var i in save.characters) {
    self.characters[i].extends(save.characters[i]);
  }
  for (var i in save.enemy) {
    self.enemy[i].extends(save.enemy[i]);
  }
  this.scopes = save.scopes;
  this.zone = save.zone;
};

/**
 * Main mechanics of the game
 * @param  {object} $timeout
 */
Game.prototype.run = function() {
  var self = this;
  var $scope = this.$scope;
  var $timeout = this.$timeout;

  this.timer = $timeout(function() {
    $scope.total_enemy_pwr = Math.max($scope.total_enemy_pwr + self.scopes.rate_enemy_pwr, 0);
    if ($scope.total_enemy_pwr > 0) {
      $scope.total_xp += self.scopes.rate_xp;
      $scope.total_gils += self.scopes.rate_gils;
    }
    self.run();
  }, 1000);
};

/**
 * Go the next zone level
 */
Game.prototype.next_zone = function() {
  this.zone.level += 1;
  this.scopes.boss_defeated = false;
  this.load();
};

/**
 * Refresh enemy & characters infos
 */
Game.prototype.refresh = function() {
  var l_enemy = this.$scope.enemy;
  var enemy = {};
  enemy.rate_enemy_pwr = 0;
  enemy.rate_xp = 0;
  enemy.rate_gils = 0;
  for (var i in l_enemy) {
    if (l_enemy[i].number == 0) continue;
    enemy.rate_xp += l_enemy[i].get_xp();
    enemy.rate_gils += l_enemy[i].get_gils();
    enemy.rate_enemy_pwr += enemy.rate_xp + enemy.rate_gils;
  }
  this.scopes.rate_xp = this.$scope.rate_xp = enemy.rate_xp;
  this.scopes.rate_gils = this.$scope.rate_gils = enemy.rate_gils;

  var l_characters = this.$scope.characters;
  var characters = {};
  characters.rate_enemy_pwr = 0;
  for (var i in l_characters) {
    if (l_characters[i].level == 0) continue;
    characters.rate_enemy_pwr += l_characters[i].get_hits();
  }
  this.scopes.rate_enemy_pwr = this.$scope.rate_enemy_pwr = characters.rate_enemy_pwr - enemy.rate_enemy_pwr;
};

/**
 * Save the game into COOKIE
 */
Game.prototype.save = function() {
  var $cookieStore = this.$cookieStore;

  var enemy = {};
  for (var i in this.enemy) {
    enemy[i] = this.enemy[i].save();
  }

  var characters = {};
  for (var i in this.characters) {
    characters[i] = this.characters[i].save();
  }

  var save = {
    "scopes": this.scopes,
    "zone": this.zone,
    "enemy": enemy,
    "characters": characters
  };

  save.scopes.total_enemy_pwr = this.$scope.total_enemy_pwr;
  save.scopes.total_xp = this.$scope.total_xp;
  save.scopes.total_gils = this.$scope.total_gils;

  $cookieStore.put('game', save);
};

/**
 * Remove the COOKIE & reset the game
 */
Game.prototype.reset = function() {
  var $cookieStore = this.$cookieStore;

  $cookieStore.remove('game');
};