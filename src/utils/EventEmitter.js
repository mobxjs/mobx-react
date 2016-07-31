function EventEmitter() {
  this.listeners = [];
}

EventEmitter.prototype.on = function(cb) {
  this.listeners.push(cb);
  var self = this;
  return function() {
    var idx = self.listeners.indexOf(cb);
    if (idx !== -1)
      self.listeners.splice(idx, 1);
  };
};

EventEmitter.prototype.emit = function(data) {
  this.listeners.forEach(function(fn) {
    fn(data);
  });
};

export default EventEmitter;
