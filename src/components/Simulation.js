import SimulationInput from "../layouts/SimulationInput";
import { useEffect, useRef, useState } from "react";
import {
  getExperimentList,
  runSimulation,
  getResultStatus,
} from "../api/simulationApi";
import Alert from "../layouts/Alert";
import { Link } from "react-router-dom";
import "ldrs/hourglass";
import { ring2 } from "ldrs";
import { XMarkIcon } from "@heroicons/react/24/solid";

function Simulation({
  selectedProject,
  nodeOptions,
  modelOptions,
  index,
  removeSimulation,
  selectSimulation,
}) {
  const [experimentOptions, setExperimentOptions] = useState([]);
  const [checkInputValidation, setCheckInputValidation] = useState(false);
  const [simulation, setSimulation] = useState({});
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState("");
  const [waiting, setWaiting] = useState(true);
  const [status, setStatus] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [checked, setChecked] = useState(false);
  const interval = useRef(null);

  ring2.register();

  useEffect(() => {
    if (simulation.modelId) {
      getExperiments();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulation.modelId]);

  useEffect(() => {
    if (status >= 3) {
      clearInterval(interval.current);
    }
  }, [status]);

  const getExperiments = () => {
    getExperimentList(selectedProject.id, simulation.modelId).then(
      (response) => {
        setExperimentOptions(response.data.data);
      }
    );
  };

  const handleChange = (e) => {
    if (e.target.name !== "finalStep") {
      setSimulation({
        ...simulation,
        [e.target.name]: parseInt(e.target.value),
      });
      return;
    }
    if (
      e.target.name === "finalStep" &&
      e.target.value > 0 &&
      e.target.value <= 100000
    ) {
      setCheckInputValidation(true);
      setSimulation({
        ...simulation,
        [e.target.name]: parseInt(e.target.value),
      });
    } else {
      setCheckInputValidation(false);
    }
  };

  const checkSimulationStatus = (resultId) => {
    interval.current = setInterval(async () => {
      await getResultStatus(resultId)
        .then((response) => {
          setWaiting(response.data.data.waiting);
          setStatus(() => response.data.data.status);
          setCurrentStep(response.data.data.currentStep);
          setProgress(
            (response.data.data.currentStep / simulation.finalStep) * 100
          );
          if (response.data.data.status === 3) {
            setSimulationStatus(
              "Simulation completed successfully. Results are now ready for viewing."
            );
          }
        })
        .catch((error) => {
          console.log(error);
          setSimulationStatus("Run simulation failed. Please try again.");
          setStatus(4);
        });
    }, 2000);
  };

  // const runSimulationEvent = async () => {
  //   console.log("Run simulation");
  //   setDisableSimulation(true);
  //   const experiments = [];
  //   const experiment = {
  //     id: simulation.experiment,
  //     modelId: simulation.model,
  //     finalStep: simulation.finalStep,
  //   };
  //   experiments.push(experiment);
  //   const projectId = process.env.REACT_APP_PROJECT_ID;
  //   const simulationInfo = {
  //     simulationRequests: [
  //       {
  //         nodeId: simulation.node,
  //         projectId: projectId,
  //         experiments: [
  //           {
  //             id: simulation.experiment,
  //             modelId: simulation.model,
  //             finalStep: simulation.finalStep,
  //           },
  //         ],
  //       },
  //     ],
  //   };
  //   setIsSimulationRunning(true);
  //   console.log(simulationInfo);
  //   await runSimulation(simulationInfo)
  //     .then((response) => {
  //       setIsSimulationRunning(true);
  //       setSimulationStatus("Success! Simulation is running.");
  //       setSimulation({
  //         ...simulation,
  //         resultId: response.data.data[0].experimentResultId,
  //       });
  //       checkSimulationStatus(response.data.data[0].experimentResultId);
  //     })
  //     .catch((error) => {
  //       error = true;
  //       setIsSimulationRunning(false);
  //       setSimulationStatus(error.response.data.message);
  //       setDisableSimulation(false);
  //       console.log(simulationStatus);
  //     });
  // };

  return (
    <>
      <div className="block p-6 mb-4 bg-white border border-gray-200 rounded-lg shadow">
        <div className="flex justify-between mb-2 items-center">
          <span>
            <input
              disabled={!checkInputValidation || simulation.finalStep == null}
              name={JSON.stringify(simulation)}
              value={index}
              onChange={selectSimulation}
              type="checkbox"
              className="cursor-pointer disabled:cursor-not-allowed accent-gray-500 size-5"
            />
          </span>
          <button
            onClick={removeSimulation}
            value={index}
            className="w-fit cursor-pointer items-center p-1 text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <div>
              <XMarkIcon value={index} className="size-6" />
            </div>
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <SimulationInput
            title="Node"
            name="nodeId"
            disabled={false}
            options={nodeOptions}
            onChange={handleChange}
          />
          <SimulationInput
            title="Model"
            name="modelId"
            disabled={simulation.nodeId == null}
            options={modelOptions}
            onChange={handleChange}
          />
          <SimulationInput
            title="Experiment"
            name="experiment"
            disabled={simulation.modelId == null}
            options={experimentOptions}
            onChange={handleChange}
          />
          <SimulationInput
            title="Final Step"
            name="finalStep"
            disabled={simulation.experiment == null}
            onChange={handleChange}
          />
        </div>
        {!waiting && (
          <div className="w-full">
            <div className="text-right font-medium text-lg mb-2">
              {currentStep}/{simulation.finalStep}{" "}
              {simulation.finalStep >= 2 ? "steps" : "step"}
            </div>
            <div className="w-full mb-4 bg-gray-200 rounded-full h-2">
              <div
                style={{ width: `${progress}%` }}
                className="bg-blue-600 h-2 rounded-full "
              ></div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center pr-8">
            {isSimulationRunning && (
              <Alert type="success" content={simulationStatus} />
            )}
            {!isSimulationRunning && simulationStatus && (
              <Alert type="error" content={simulationStatus} />
            )}
          </div>
          <div className="place-items-center grid grid-flow-col">
            {!waiting && status === 3 && (
              <>
                <Link
                  to={{
                    pathname: "/view-steps",
                  }}
                  state={simulation}
                >
                  <button className="flex hover:cursor-pointer items-center justify-center p-0.5 me-2 overflow-hidden text-md font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-cyan-500 to-blue-500 group-hover:from-cyan-500 group-hover:to-blue-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-cyan-200">
                    <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-opacity-0">
                      View step-by-step
                    </span>
                  </button>
                </Link>
                <Link
                  to={{
                    pathname: "/play-animation",
                  }}
                  state={simulation}
                >
                  <button className="flex hover:cursor-pointer items-center justify-center p-0.5 me-2 overflow-hidden text-md font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-pink-500 to-orange-400 group-hover:from-pink-500 group-hover:to-orange-400 hover:text-white focus:ring-4 focus:outline-none focus:ring-pink-200">
                    <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-opacity-0">
                      Play simulation
                    </span>
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Simulation;
