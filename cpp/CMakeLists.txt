cmake_minimum_required(VERSION 3.10)
project(LayoutEngine)

set(CMAKE_CXX_STANDARD 17)

add_library(engine SHARED engine.cpp)

if(APPLE)
    set_target_properties(engine PROPERTIES SUFFIX ".dylib")
elseif(WIN32)
    set_target_properties(engine PROPERTIES SUFFIX ".dll")
else()
    set_target_properties(engine PROPERTIES SUFFIX ".so")
endif()
