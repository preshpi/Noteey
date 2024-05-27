"use client";
import ProtectedRoute from "@/app/ProtectedRoute";
import Card from "@/app/components/Card";
import Input from "@/app/components/Input";
import TopBar from "@/app/components/TopBar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { BiSearch } from "react-icons/bi";
import { toast } from "sonner";
import { BsGrid } from "react-icons/bs";
import CreateNoteModal from "@/app/components/Modals/CreateNoteModal";

import {
  Timestamp,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/app/firebase";
import moment from "moment";
import { useAuthState } from "react-firebase-hooks/auth";
import { HiMiniArrowsUpDown } from "react-icons/hi2";
import { CiBoxList, CiMusicNote1 } from "react-icons/ci";
import { useAppContext } from "@/app/context/AppContext";
import useModalAnimation from "@/app/components/Modals/useModalAnimation";

const Notes = () => {
  const [user, loading] = useAuthState(auth);
  const [notes, setNotes] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [ascendingOrder, setAscendingOrder] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [searchInput, setSearchInput] = useState("");
  const [tooltipView, setTooltipView] = useState(false);
  const [tooltipOrder, setTooltipOrder] = useState(false);
  const { color, createNote, setCreateNote } = useAppContext();
  const background = color || "#e85444";
  const bg = { backgroundColor: background };

  const text = color || "#e85444";
  const textStyle = { color: text };

  const formatTimestamp = (timestamp: Timestamp): string | null => {
    if (timestamp) {
      const seconds = timestamp.seconds;
      const nanoseconds = timestamp.nanoseconds / 1000000;
      const date = new Date(seconds * 1000 + nanoseconds);
      return moment(date).format("MM/DD/YYYY - h:mm A");
    }
    return "";
  };

  const handleFetchNote = useCallback(async () => {
    if (user && !loading) {
      const userDocRef = doc(db, "user", user?.uid); // Reference to the user document
      const noteCollectionRef = collection(userDocRef, "note"); // Reference to the "note" subcollection
      const notesQuery = query(
        noteCollectionRef,
        orderBy("timestamp", ascendingOrder ? "desc" : "asc")
      );
      try {
        const querySnapshot = await getDocs(notesQuery);
        const notesData: React.SetStateAction<any[]> = [];
        querySnapshot.forEach((doc) => {
          notesData.push({ id: doc.id, ...doc.data() });
        });
        //apply the formate function to the timestamp inside the data directly
        const formattedNotes = notesData.map((data) => ({
          ...data,
          date: formatTimestamp(data.timestamp),
        }));

        setNotes(formattedNotes);
        setFetching(false);
      } catch (error) {
        toast.error("Error fetching notes");
      }
    }
  }, [user, loading, ascendingOrder]);

  const handleToggleOrder = () => {
    setAscendingOrder((prevOrder) => {
      return !prevOrder;
    });
    setTooltipOrder(true);
    handleFetchNote();
  };

  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Handle click outside of the modal to close it
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setTooltipView(false);
        setTooltipOrder(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    // Clean up event listener when the component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalRef]);

  useModalAnimation(modalRef);

  const handleViewMode = () => {
    setViewMode((prevMode) => (prevMode === "grid" ? "list" : "grid"));
    setTooltipView(true);
  };

  const handleDeleteCard = async (id: string) => {
    if (user) {
      const userDocRef = doc(db, "user", user.uid);
      const cardDocRef = doc(userDocRef, "note", id);
      const deletedNotesCollectionRef = collection(userDocRef, "deletedNotes");

      try {
        await runTransaction(db, async (transaction) => {
          // Get the note to be deleted
          const noteSnapshot = await transaction.get(cardDocRef);
          const noteData = noteSnapshot.data();

          // Move the note to the "deletedNotes" collection
          await transaction.set(doc(deletedNotesCollectionRef, id), noteData);

          // Delete the note from the "note" collection
          await transaction.delete(cardDocRef);
        });

        // Remove the note from the current notes list
        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));

        toast.success("Note moved to Trash");
      } catch (error) {
        toast.error("Error moving the note");
      }
    }
  };

  const handleUpdateDoc = async (id: string, newTitle: string) => {
    if (user) {
      const userDocRef = doc(db, "user", user.uid);
      const cardDocRef = doc(userDocRef, "note", id);

      try {
        await updateDoc(cardDocRef, {
          title: newTitle,
        });

        setNotes((prevNotes) =>
          prevNotes.map((note) =>
            note.id === id ? { ...note, title: newTitle } : note
          )
        );
        toast.success("Note title updated successfully");
      } catch (error) {
        toast.error("Error updating the card title");
      }
    }
  };

  const addNewNote = (newNote: any) => {
    const timestamp = Timestamp.fromDate(new Date()); // Use the current date as an example
    const formattedNote = {
      ...newNote,
      timestamp: timestamp,
      date: formatTimestamp(timestamp),
    };

    setNotes((prevNotes) => [formattedNote, ...prevNotes]);
  };

  useEffect(() => {
    if (!loading) {
      handleFetchNote();
    }
  }, [handleFetchNote, loading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col w-full min-h-screen overflow-auto">
        <TopBar />
        <div className="p-5 flex flex-col gap-5 h-full">
          <div className="flex gap-y-5 lg:justify-between flex-col lg:flex-row">
            <div className="flex items-center justify-between w-[300px] dark:bg-[#2C2C2C] bg-[#F7F7F7] border-none text-[14px] rounded-lg focus-within:shadow-md">
              <Input
                type="search"
                id="search"
                value={searchInput}
                onChange={handleInputChange}
                required
                autoComplete="off"
                additionalClasses="h-10 w-full rounded-md w-full text-[#5C5C5C] dark:text-[#747373] bg-transparent px-4 py-3 text-[15px] font-light outline-none md:placeholder-[#5C5C5C]"
                name="search"
                placeholder="Search notes"
              />
              <span
                style={textStyle}
                className="px-3 py-3 text-xl cursor-pointer"
              >
                <BiSearch />
              </span>
            </div>

            <div className="flex gap-5 text-[#d6d5d5] items-center">
              <button
                onClick={handleToggleOrder}
                style={textStyle}
                className="px-4 py-3 rounded hover:opacity-90 dark:bg-[#2C2C2C] bg-[#EAEAEA] transition-all duration-300"
              >
                <HiMiniArrowsUpDown />
              </button>
              {tooltipOrder && (
                <div
                  ref={modalRef}
                  style={{
                    ...bg,
                    opacity: tooltipOrder ? 1 : 0,
                    transition: "opacity 0.3s ease-in-out",
                  }}
                  className="absolute text-white lg:top-[140px] lg:right-[25px] px-2 py-2 rounded-md lg:mt-4 mt-24 text-[10px]"
                >
                  <div
                    className="w-3 h-3 -mt-2.5 absolute rotate-45"
                    style={bg}
                  ></div>
                  <p className="relative">
                    {ascendingOrder ? "Ascending order" : "Descending order"}
                  </p>{" "}
                </div>
              )}
              <button
                onClick={handleViewMode}
                style={textStyle}
                className="px-4 py-3 relative rounded hover:opacity-90 dark:bg-[#2C2C2C] bg-[#EAEAEA] transition-all duration-300"
              >
                {viewMode === "grid" ? <BsGrid /> : <CiBoxList />}
              </button>
              {tooltipView && (
                <div
                  ref={modalRef}
                  style={{
                    ...bg,
                    opacity: tooltipView ? 1 : 0,
                    transition: "opacity 0.3s ease-in-out",
                  }}
                  className="absolute text-white lg:top-[140px] lg:right-[20px] px-2 py-2 rounded-md lg:mt-4 mt-24 text-[10px] transition-all duration-300"
                >
                  <div
                    className="w-3 h-3 -mt-2.5 absolute rotate-45 right-[1rem]"
                    style={bg}
                  ></div>
                  {viewMode === "grid" ? (
                    <p>switch to list view</p>
                  ) : (
                    <p>switch to grid view</p>
                  )}
                </div>
              )}
            </div>
          </div>
          <section
            className={`flex flex-col mt-12  ${
              notes?.length === 0 ? "justify-center " : "justify-start"
            }items-center h-full`}
          >
            <div className="flex justify-center items-center">
              {loading && <div className="spinner"></div>}
            </div>
            <>
              {!fetching && notes?.length === 0 ? (
                <h3 className="text-gray-400 font-semibold text-[28px] text-center">
                  No Notes
                </h3>
              ) : (
                <div
                  className={`gap-5 w-full ${
                    viewMode === "grid"
                      ? "flex flex-wrap justify-start"
                      : "grid"
                  }`}
                >
                  {notes
                    .filter(
                      (data) =>
                        !searchInput ||
                        data.title
                          .toLowerCase()
                          .includes(searchInput.toLocaleLowerCase())
                    )
                    .map((data: any) => (
                      <div key={data.id}>
                        <Card
                          id={data.id}
                          content={data.title}
                          date={data.date}
                          handleDeleteCard={handleDeleteCard}
                          handleUpdateDoc={handleUpdateDoc}
                          viewMode={viewMode}
                        />
                      </div>
                    ))}
                </div>
              )}
            </>
          </section>

          {createNote && (
            <CreateNoteModal
              show={createNote}
              content="Create a note"
              setShow={setCreateNote}
              buttonContent="Submit"
              addNewNote={addNewNote}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Notes;
