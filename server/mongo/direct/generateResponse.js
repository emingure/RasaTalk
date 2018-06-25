const co = require('co');
const uuidv1 = require('uuid/v1');
const get = require('../controllers/dialog/get');
const TraverseNodes = require('./traverseNodes');
const Session = require('../controllers/session');
const debug = require('debug')('GenerateResponse:');
const History = require('../controllers/message_history');
const { parseInteral } = require('../controllers/training');

function generateResponse(req, res) {
  const { uid } = req.params;
  const { message, project, model } = req.body;

  co(function* t() {
    try {
      // eslint-disable-next-line no-unused-vars

      const [history, flow, { data }, session] = yield [
        History.addToHistory(uid, { type: 'human', message }),
        get.flow(),
        parseInteral({ project, q: message, model }),
        Session.getSessionInternal(uid),
      ];

      data.ruid = uuidv1();

      const traverseNodes = new TraverseNodes(flow, data, session, {});

      yield traverseNodes.start();

      const replies = traverseNodes.getReplies();

      yield [session.save(), History.addToHistoryBot(uid, replies)];

      res.send(replies);
    } catch (error) {
      debug(error);
      res.send([{ type: 'bot', text: 'Sorry something went wrong' }]);
    }
  });
}

module.exports = {
  generateResponse,
};
