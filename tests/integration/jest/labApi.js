/**
* Api interfact to a lab instance
*/

import { get, post } from './util/apiHelper';

export const fetchDatasets = () => get('http://lab:5080/api/userdatasets');
export const fetchDataset = (id) => get(`http://lab:5080/api/datasets/${id}`);

export const fetchMachines = () => get('http://lab:5080/api/v1/machines');

export const fetchExperiments = () => get('http://lab:5080/api/userexperiments');
export const fetchExperiment = (id) => get(`http://lab:5080/api/v1/experiments/${id}`);

export const fetchAlgorithms = () => get('http://lab:5080/api/projects');

export const submitExperiment = (algorithm, params) => 
  post(`http://lab:5080/api/v1/projects/${algorithm}/experiment`, params);