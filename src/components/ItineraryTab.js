// src/components/ItineraryTab.js
import React, { useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import DayTabs from "./DayTabs";
import ActivityItem from "./ActivityItem";
import Modal from "./Modal";
import ActivityForm from "./ActivityForm";

import { ICON_SVG } from "../utils/icons";
import { useTheme } from "../utils/theme";
import { useActivities } from "../hooks/useActivities";

const ItineraryTab = ({ userId, itinerary }) => {
  const { theme } = useTheme();

  const [activeDay, setActiveDay] = useState(1);

  const {
    activities,
    addActivity: hookAddActivity,
    deleteActivity,
    updateActivity,
    reorderActivities,
  } = useActivities(userId, itinerary.id, activeDay);

  const [editingActivityId, setEditingActivityId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDragEnd = useCallback(
    (result) => {
      if (!result.destination) return;
      const { source, destination } = result;
      if (source.index === destination.index) return;
      const reorderedActivities = Array.from(activities);
      const [movedItem] = reorderedActivities.splice(source.index, 1);
      reorderedActivities.splice(destination.index, 0, movedItem);
      reorderActivities(reorderedActivities);
    },
    [activities, reorderActivities]
  );

  const startEditActivity = useCallback((activity) => {
    setEditingActivityId(activity.id);
    setEditFormData({ ...activity });
  }, []);

  const handleEditInputChange = useCallback((e) => {
    setEditFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const saveEdit = useCallback(
    async (activityId) => {
      await updateActivity(activityId, editFormData);
      setEditingActivityId(null);
    },
    [updateActivity, editFormData]
  );

  const cancelEdit = useCallback(() => {
    setEditingActivityId(null);
    setEditFormData({});
  }, []);

  const handleAddActivity = async (activityData) => {
    setIsSubmitting(true);
    try {
      await hookAddActivity(activityData);
      setIsModalOpen(false);
    } catch (error) {
      alert("新增失敗: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-2 sm:p-6 rounded-xl shadow-lg relative min-h-[500px]">
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm pt-2 pb-2 -mx-2 px-2 border-b border-gray-100 mb-4">
        <DayTabs
          totalDays={itinerary.durationDays}
          activeDay={activeDay}
          setActiveDay={setActiveDay}
          startDate={itinerary.startDate}
        />
      </div>

      <h3 className="text-2xl font-semibold mb-6 pt-2">
        Day {activeDay}{" "}
        <span className="text-base text-gray-400 font-normal ml-2">的活動</span>
      </h3>

      <div className="relative mb-10">
        {activities.length > 0 ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="activities-list">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className=""
                >
                  {activities.map((activity, index) => (
                    <Draggable
                      key={activity.id}
                      draggableId={activity.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={{ ...provided.draggableProps.style }}
                        >
                          <ActivityItem
                            activity={activity}
                            index={index}
                            totalDays={itinerary.durationDays}
                            onDelete={deleteActivity}
                            onStartEdit={startEditActivity}
                            isEditing={editingActivityId === activity.id}
                            editData={
                              editingActivityId === activity.id
                                ? editFormData
                                : undefined
                            }
                            onEditChange={handleEditInputChange}
                            onSaveEdit={saveEdit}
                            onCancelEdit={cancelEdit}
                            dragHandleProps={provided.dragHandleProps}
                            isDragging={snapshot.isDragging}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg text-gray-500">
            <p className="font-medium">這一天目前還沒有安排活動。</p>
            <p className="text-sm">請點擊右下角的 + 按鈕新增活動！</p>
          </div>
        )}
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className={`fixed right-6 bottom-32 sm:right-10 sm:bottom-32 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white ${theme.buttonPrimary} transition-all duration-300 transform hover:scale-105 z-40`}
      >
        <ICON_SVG.plusSmall className="w-8 h-8" />
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`新增活動 (Day ${activeDay})`}
      >
        <ActivityForm
          onSubmit={handleAddActivity}
          isSubmitting={isSubmitting}
        />
      </Modal>
    </div>
  );
};

export default ItineraryTab;
