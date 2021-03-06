import io from 'socket.io-client';
import { updateAI, updateDataset } from 'data/datasets/dataset/actions';
import { addExperiment, updateExperiment } from 'data/experiments/actions';
import { fetchRecommender} from 'data/recommender/actions';

let socket = io(`${location.protocol}//${location.hostname}:${location.port}`);
/**
* Based on various network events, emit/dispatch corresponding redux action
*
*/
const configSocket = (store) => {
  socket.on('updateAIToggle', data => {
    const parsed = JSON.parse(data);
    store.dispatch(updateAI(parsed._id, parsed.nextAIState));
  });

  socket.on('updateDataset', data => {
    const dataset = JSON.parse(data)[0];
    store.dispatch(updateDataset(dataset));
  });

  socket.on('updateExperiment', data => {
    const experiment = JSON.parse(data)[0];
    store.dispatch(updateExperiment(experiment));
  });

  socket.on('addExperiment', data => {
    const experiment = JSON.parse(data)[0];
    store.dispatch(addExperiment(experiment));
  });

  socket.on('updateRecommender', data => {
    store.dispatch(fetchRecommender());
  });
};

export default configSocket;
