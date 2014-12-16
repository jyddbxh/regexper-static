import Regexper from 'src/js/regexper.js';
import Q from 'q';

describe('regexper.js', function() {

  beforeEach(function() {
    this.root = document.createElement('div');
    this.root.innerHTML = [
      '<form id="regexp-form" action="/"><input type="text" id="regexp-input" /></form>',
      '<div id="error"></div>',
      '<div><a href="#" data-glyph="link-intact"></a></div>',
      '<div><a href="#" data-glyph="data-transfer-download"></a></div>',
      '<div id="progress"><div></div></div>',
      '<div id="regexp-render"><svg></svg></div>'
    ].join('');

    this.regexper = new Regexper(this.root);
    spyOn(this.regexper, '_setHash');
    spyOn(this.regexper, '_getHash').and.returnValue('example hash value');
  });

  describe('#keypressListener', function() {

    beforeEach(function() {
      this.event = document.createEvent('Event');
      spyOn(this.event, 'preventDefault');
      spyOn(this.regexper.form, 'dispatchEvent');
    });

    describe('when the shift key is not depressed', function() {

      beforeEach(function() {
        this.event.shiftKey = false;
        this.event.keyCode = 13;
      });

      it('does not prevent the default action', function() {
        this.regexper.keypressListener(this.event);
        expect(this.event.returnValue).not.toEqual(false);
        expect(this.event.preventDefault).not.toHaveBeenCalled();
      });

      it('does not trigger a submit event', function() {
        this.regexper.keypressListener(this.event);
        expect(this.regexper.form.dispatchEvent).not.toHaveBeenCalled();
      });

    });

    describe('when the keyCode is not 13 (Enter)', function() {

      beforeEach(function() {
        this.event.shiftKey = true;
        this.event.keyCode = 42;
      });

      it('does not prevent the default action', function() {
        this.regexper.keypressListener(this.event);
        expect(this.event.returnValue).not.toEqual(false);
        expect(this.event.preventDefault).not.toHaveBeenCalled();
      });

      it('does not trigger a submit event', function() {
        this.regexper.keypressListener(this.event);
        expect(this.regexper.form.dispatchEvent).not.toHaveBeenCalled();
      });

    });

    describe('when the shift key is depressed and the keyCode is 13 (Enter)', function() {

      beforeEach(function() {
        this.event.shiftKey = true;
        this.event.keyCode = 13;
      });

      it('prevents the default action', function() {
        this.regexper.keypressListener(this.event);
        expect(this.event.returnValue).not.toEqual(true);
        expect(this.event.preventDefault).toHaveBeenCalled();
      });

      it('triggers a submit event', function() {
        var event;

        this.regexper.keypressListener(this.event);
        expect(this.regexper.form.dispatchEvent).toHaveBeenCalled();

        event = this.regexper.form.dispatchEvent.calls.mostRecent().args[0];
        expect(event.type).toEqual('submit');
      });

    });

  });

  describe('#submitListener', function() {

    beforeEach(function() {
      this.event = document.createEvent('Event');
      spyOn(this.event, 'preventDefault');

      this.regexper.field.value = 'example value';
    });

    it('prevents the default action', function() {
      this.regexper.submitListener(this.event);
      expect(this.event.returnValue).not.toEqual(true);
      expect(this.event.preventDefault).toHaveBeenCalled();
    });

    it('sets the location.hash', function() {
      this.regexper.submitListener(this.event);
      expect(this.regexper._setHash).toHaveBeenCalledWith('example value');
    });

    describe('when setting location.hash fails', function() {

      beforeEach(function() {
        this.regexper._setHash.and.throwError('hash failure');
      });

      it('disables the permalink', function() {
        this.regexper.submitListener(this.event);
        expect(this.regexper.permalinkEnabled).toEqual(false);
      });

      it('shows the expression directly', function() {
        spyOn(this.regexper, 'showExpression');
        this.regexper.submitListener(this.event);
        expect(this.regexper.showExpression).toHaveBeenCalledWith('example value');
      });

    });

  });

  describe('#hashchangeListener', function() {

    it('enables the permalink', function() {
      this.regexper.hashchangeListener();
      expect(this.regexper.permalinkEnabled).toEqual(true);
    });

    it('shows the expression from the hash', function() {
      spyOn(this.regexper, 'showExpression');
      this.regexper.hashchangeListener();
      expect(this.regexper.showExpression).toHaveBeenCalledWith('example hash value');
    });

  });

  describe('#updatePercentage', function() {

    beforeEach(function() {
      this.event = document.createEvent('Event');
      this.event.detail = { percentage: 0.42 };
    });

    it('sets the width of the progress bar', function() {
      this.regexper.updatePercentage(this.event);
      expect(this.regexper.percentage.style.width).toEqual('42%');
    });

  });

  describe('#bindListeners', function() {

    it('binds #keypressListener to keypress on the text field', function() {
      spyOn(this.regexper.field, 'addEventListener');
      spyOn(this.regexper, 'keypressListener');
      this.regexper.bindListeners();
      expect(this.regexper.field.addEventListener).toHaveBeenCalledWith('keypress', jasmine.any(Function));

      this.regexper.field.addEventListener.calls.mostRecent().args[1]();
      expect(this.regexper.keypressListener).toHaveBeenCalled();
    });

    it('binds #submitListener to submit on the form', function() {
      spyOn(this.regexper.form, 'addEventListener');
      spyOn(this.regexper, 'submitListener');
      this.regexper.bindListeners();
      expect(this.regexper.form.addEventListener).toHaveBeenCalledWith('submit', jasmine.any(Function));

      this.regexper.form.addEventListener.calls.mostRecent().args[1]();
      expect(this.regexper.submitListener).toHaveBeenCalled();
    });

    it('binds #updatePercentage to updateStatus on the root', function() {
      spyOn(this.regexper.root, 'addEventListener');
      spyOn(this.regexper, 'updatePercentage');
      this.regexper.bindListeners();
      expect(this.regexper.root.addEventListener).toHaveBeenCalledWith('updateStatus', jasmine.any(Function));

      this.regexper.root.addEventListener.calls.mostRecent().args[1]();
      expect(this.regexper.updatePercentage).toHaveBeenCalled();
    });

    it('binds #hashchangeListener to hashchange on the window', function() {
      spyOn(window, 'addEventListener');
      spyOn(this.regexper, 'hashchangeListener');
      this.regexper.bindListeners();
      expect(window.addEventListener).toHaveBeenCalledWith('hashchange', jasmine.any(Function));

      window.addEventListener.calls.mostRecent().args[1]();
      expect(this.regexper.hashchangeListener).toHaveBeenCalled();
    });

  });

  describe('#showExpression', function() {

    beforeEach(function() {
      this.renderPromise = Q.defer();
      spyOn(this.regexper, 'renderRegexp').and.returnValue(this.renderPromise.promise);
    });

    it('sets the text field value', function() {
      this.regexper.showExpression('example expression');
      expect(this.regexper.field.value).toEqual('example expression');
    });

    describe('when the expression is blank', function() {

      it('clears the state', function() {
        this.regexper.showExpression('');
        expect(this.regexper.state).toEqual('');
      });

    });

    describe('when the expression is not blank', function() {

      it('sets the state to "is-loading"', function() {
        this.regexper.showExpression('example expression');
        expect(this.regexper.state).toEqual('is-loading');
      });

      it('renders the expression', function() {
        this.regexper.showExpression('example expression');
        expect(this.regexper.renderRegexp).toHaveBeenCalledWith('example expression');
      });

      describe('when the expression finishes rendering', function() {

        beforeEach(function(done) {
          spyOn(this.regexper, 'updateLinks');
          this.regexper.showExpression('example expression');
          this.renderPromise.resolve();
          setTimeout(done, 100);
        });

        it('sets the state to "has-results"', function() {
          expect(this.regexper.state).toEqual('has-results');
        });

        it('updates the links', function() {
          expect(this.regexper.updateLinks).toHaveBeenCalled();
        });

      });

    });

  });

  describe('#updateLinks', function() {

    beforeEach(function() {
      spyOn(this.regexper, 'buildBlobURL');
    });

    describe('when blob URLs are supported', function() {

      beforeEach(function() {
        this.regexper.buildBlobURL.and.returnValue('http://example.com/blob');
      });

      it('sets the download link href', function() {
        this.regexper.updateLinks();
        expect(this.regexper.download.href).toEqual('http://example.com/blob');
      });

    });

    describe('when blob URLs are not supported', function() {

      beforeEach(function() {
        this.regexper.buildBlobURL.and.throwError('blob failure');
      });

      it('hides the download link', function() {
        this.regexper.updateLinks();
        expect(this.regexper.download.parentNode.style.display).toEqual('none');
      });

    });

    describe('when the permalink is enabled', function() {

      beforeEach(function() {
        this.regexper.permalinkEnabled = true;
      });

      it('sets the permalink href', function() {
        this.regexper.updateLinks();
        expect(this.regexper.permalink.href).toEqual(location.toString());
      });

    });

    describe('when the permalink is disabled', function() {

      beforeEach(function() {
        this.regexper.permalinkEnabled = false;
      });

      it('hides the permalink', function() {
        this.regexper.updateLinks();
        expect(this.regexper.permalink.parentNode.style.display).toEqual('none');
      });

    });

  });

  describe('#renderRegexp', function() {



  });

});
