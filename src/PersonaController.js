///<reference path="FusionCalculator.ts"/>
///<reference path="../data/PersonaData.ts"/>
///<reference path="../data/SkillData.ts"/>
/**
 * Created by Chin on 08-Apr-17.
 */
var PersonaController = (function () {
    function PersonaController($scope, $routeParams, $filter) {
        var personaName = $routeParams.persona_name;
        this.$filter = $filter;
        this.$scope = $scope;
        this.$scope.Math = Math;
        this.$scope.personaName = personaName;
        this.$scope.persona = personaMap[personaName];
        if (!this.$scope.persona)
            return;
        this.$scope.allRecipes = [];
        this.getRecipes();
        this.$scope.allRecipes.sort(function (a, b) { return a.cost - b.cost; });
        this.$scope.maxCost = 0;
        for (var i = 0, recipe = null; recipe = this.$scope.allRecipes[i]; i++) {
            recipe.num = i;
            this.$scope.maxCost = Math.max(this.$scope.maxCost, recipe.cost);
        }
        var compediumEntry = personaMap[personaName];
        this.$scope.persona.stats = compediumEntry.stats;
        this.$scope.persona.statsHeader = ["Strength", "Magic", "Endurance", "Agility", "Luck"];
        this.$scope.persona.elems = getElems(personaName);
        this.$scope.persona.elemsHeader = ["Physical", "Gun", "Fire", "Ice", "Electric", "Wind", "Psychic", "Nuclear", "Bless", "Curse"];
        // Note: skillList are skills in a sorted list for displaying with Angular.
        // It's different from the existing skills property which is a map.
        this.$scope.persona.skillList = getSkills(personaName);
        this.$scope.perPage = 100;
        this.$scope.lastPage = Math.floor(this.$scope.allRecipes.length / this.$scope.perPage);
        this.$scope.pageNum = 0;
        this.$scope.$watch('filterStr', this.paginateAndFilter.bind(this));
        this.$scope.$watch('filterStr', this.resetPage.bind(this));
        this.$scope.$watch('pageNum', this.paginateAndFilter.bind(this), false);
    }
    PersonaController.prototype.addRecipe = function (recipe) {
        recipe.cost = 0;
        for (var i = 0, source = null; source = recipe.sources[i]; i++) {
            var level = source.level;
            recipe.cost += (27 * level * level) + (126 * level) + 2147;
        }
        // Sort ingredients so that highest level persona is first
        recipe.sources = this.$filter('orderBy')(recipe.sources, ['-level']);
        this.$scope.allRecipes.push(recipe);
    };
    PersonaController.prototype.getRecipes = function () {
        if (this.$scope.persona.rare) {
            return;
        }
        // Check special recipes.
        if (this.$scope.persona.special) {
            for (var i = 0, combo = null; combo = specialCombos[i]; i++) {
                if (this.$scope.persona.name == combo.result) {
                    var recipe = { 'sources': [] };
                    for (var j = 0, source = null; source = combo.sources[j]; j++) {
                        recipe.sources.push(personaMap[source]);
                    }
                    this.addRecipe(recipe);
                    return;
                }
            }
        }
        // Consider straight fusion.
        function filter2Way(persona1, persona2, result) {
            if (persona1.name == this.$scope.persona.name)
                return true;
            if (persona2.name == this.$scope.persona.name)
                return true;
            if (result.name == this.$scope.persona.name)
                return false;
            return true;
        }
        var recipes = this.getArcanaRecipes(this.$scope.persona.arcana, filter2Way);
        for (var i = 0, recipe = null; recipe = recipes[i]; i++) {
            this.addRecipe(recipe);
        }
    };
    PersonaController.prototype.getArcanaRecipes = function (arcanaName, filterCallback) {
        var recipes = [];
        var combos = arcana2Combos.filter(function (x) { return x.result == arcanaName; });
        for (var i = 0, combo = null; combo = combos[i]; i++) {
            var personae1 = personaeByArcana[combo.source[0]];
            var personae2 = personaeByArcana[combo.source[1]];
            for (var j = 0, persona1 = null; persona1 = personae1[j]; j++) {
                for (var k = 0, persona2 = null; persona2 = personae2[k]; k++) {
                    if (persona1.arcana == persona2.arcana && k <= j)
                        continue;
                    if (persona1.rare && !persona2.rare)
                        continue;
                    if (persona2.rare && !persona1.rare)
                        continue;
                    var result = FusionCalculator.fuse2(combo.result, persona1, persona2);
                    if (!result)
                        continue;
                    if (filterCallback
                        && filterCallback.call(this, persona1, persona2, result)) {
                        continue;
                    }
                    recipes.push({ 'sources': [persona1, persona2] });
                }
            }
        }
        for (var i = 0; i < rarePersonae.length; i++) {
            var rarePersona = personaMap[rarePersonae[i]];
            var personae = personaeByArcana[this.$scope.persona.arcana];
            for (var j = 0; j < personae.length; j++) {
                var mainPersona = personae[j];
                if (rarePersona == mainPersona)
                    continue;
                var result = FusionCalculator.fuseRare(rarePersona, mainPersona);
                if (!result)
                    continue;
                if (filterCallback
                    && filterCallback.call(this, rarePersona, mainPersona, result)) {
                    continue;
                }
                recipes.push({ 'sources': [rarePersona, mainPersona] });
            }
        }
        return recipes;
    };
    /**
     * Note: this can the scope that is passed in, or this.$scope.
     * Using the passed in scope for brevity.
     */
    PersonaController.prototype.paginateAndFilter = function (newVal, oldVal, scope) {
        if (scope.pageNum < 0)
            scope.pageNum = 0;
        if (scope.pageNum > scope.lastPage)
            scope.pageNum = scope.lastPage;
        if (scope.filterStr) {
            scope.recipes = this.$filter('filter')(scope.allRecipes, scope.filterStr);
        }
        else {
            scope.recipes = scope.allRecipes;
        }
        scope.numRecipes = scope.recipes.length;
        scope.recipes = scope.recipes.slice(scope.pageNum * scope.perPage, scope.pageNum * scope.perPage + scope.perPage);
    };
    PersonaController.prototype.resetPage = function (newVal, oldVal, scope) {
        scope.pageNum = 0;
    };
    return PersonaController;
}());