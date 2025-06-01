class Controller {
  constructor() {
    // Initialization code
  }

  result(message, data, status = 200) {
    return {
      status: status,
      message: message,
      data: data
    };
  }

}

module.exports = Controller;