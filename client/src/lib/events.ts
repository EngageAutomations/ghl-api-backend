// Simple event emitter for component communication
export const cssUpdateEmitter = {
  listeners: [] as Function[],
  
  subscribe(callback: Function) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  },
  
  emit(configData?: any) {
    console.log("Emitting CSS update event with data:", configData);
    this.listeners.forEach(listener => listener(configData));
  }
};